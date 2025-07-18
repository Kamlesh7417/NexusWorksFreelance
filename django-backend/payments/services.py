"""
Payment gateway integration and processing services
"""
import stripe
import paypalrestsdk
import logging
import json
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import (
    Payment, PaymentGateway, TransactionLog, PaymentDispute, 
    PaymentMethod, Milestone
)
from projects.models import Project
from users.models import User

logger = logging.getLogger(__name__)


class PaymentGatewayService:
    """Base payment gateway service"""
    
    def __init__(self, gateway: PaymentGateway):
        self.gateway = gateway
        self.setup_gateway()
    
    def setup_gateway(self):
        """Setup gateway-specific configuration"""
        raise NotImplementedError("Subclasses must implement setup_gateway")
    
    def process_payment(self, payment: Payment) -> Dict:
        """Process a payment through the gateway"""
        raise NotImplementedError("Subclasses must implement process_payment")
    
    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None) -> Dict:
        """Refund a payment"""
        raise NotImplementedError("Subclasses must implement refund_payment")
    
    def get_payment_status(self, transaction_id: str) -> Dict:
        """Get payment status from gateway"""
        raise NotImplementedError("Subclasses must implement get_payment_status")


class StripePaymentService(PaymentGatewayService):
    """Stripe payment gateway integration"""
    
    def setup_gateway(self):
        """Setup Stripe configuration"""
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.publishable_key = settings.STRIPE_PUBLISHABLE_KEY
        self.webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    def process_payment(self, payment: Payment) -> Dict:
        """Process payment through Stripe"""
        try:
            # Create payment intent for direct payment
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # Convert to cents
                currency='usd',
                automatic_payment_methods={'enabled': True},
                metadata={
                    'payment_id': str(payment.id),
                    'project_id': str(payment.milestone.project.id),
                    'developer_id': str(payment.developer.id),
                }
            )
            
            # Update payment with transaction details
            payment.transaction_id = intent.id
            payment.gateway_response = intent
            payment.status = 'processing'
            payment.save()
            
            # Log transaction
            self._log_transaction(
                payment, 
                'payment_initiated', 
                f"Stripe payment intent created: {intent.id}"
            )
            
            return {
                'success': True,
                'transaction_id': intent.id,
                'client_secret': intent.client_secret,
                'status': intent.status
            }
            
        except stripe.error.StripeError as e:
            self._log_transaction(
                payment, 
                'payment_failed', 
                f"Stripe error: {str(e)}",
                log_level='error'
            )
            payment.status = 'failed'
            payment.save()
            
            return {
                'success': False,
                'error': str(e),
                'error_code': e.code if hasattr(e, 'code') else 'stripe_error'
            }
    
    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None) -> Dict:
        """Refund payment through Stripe"""
        try:
            refund_amount = amount or payment.amount
            
            refund = stripe.Refund.create(
                payment_intent=payment.transaction_id,
                amount=int(refund_amount * 100),
                metadata={
                    'payment_id': str(payment.id),
                    'refund_reason': 'dispute_resolution'
                }
            )
            
            self._log_transaction(
                payment,
                'refund_completed',
                f"Stripe refund completed: {refund.id}"
            )
            
            return {
                'success': True,
                'refund_id': refund.id,
                'amount': refund_amount,
                'status': refund.status
            }
            
        except stripe.error.StripeError as e:
            self._log_transaction(
                payment,
                'refund_failed',
                f"Stripe refund error: {str(e)}",
                log_level='error'
            )
            
            return {
                'success': False,
                'error': str(e),
                'error_code': e.code if hasattr(e, 'code') else 'stripe_refund_error'
            }
    
    def get_payment_status(self, transaction_id: str) -> Dict:
        """Get payment status from Stripe"""
        try:
            intent = stripe.PaymentIntent.retrieve(transaction_id)
            return {
                'success': True,
                'status': intent.status,
                'amount': Decimal(intent.amount) / 100,
                'currency': intent.currency,
                'created': datetime.fromtimestamp(intent.created)
            }
        except stripe.error.StripeError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _log_transaction(self, payment: Payment, log_type: str, message: str, log_level: str = 'info'):
        """Log transaction details"""
        TransactionLog.objects.create(
            payment=payment,
            log_type=log_type,
            log_level=log_level,
            message=message,
            gateway_response=payment.gateway_response
        )


class PayPalPaymentService(PaymentGatewayService):
    """PayPal payment gateway integration"""
    
    def setup_gateway(self):
        """Setup PayPal configuration"""
        paypalrestsdk.configure({
            "mode": "sandbox" if settings.DEBUG else "live",
            "client_id": settings.PAYPAL_CLIENT_ID,
            "client_secret": settings.PAYPAL_CLIENT_SECRET
        })
    
    def process_payment(self, payment: Payment) -> Dict:
        """Process payment through PayPal"""
        try:
            payout = paypalrestsdk.Payout({
                "sender_batch_header": {
                    "sender_batch_id": f"payment_{payment.id}",
                    "email_subject": "Payment from Freelance Platform"
                },
                "items": [{
                    "recipient_type": "EMAIL",
                    "amount": {
                        "value": str(payment.amount),
                        "currency": "USD"
                    },
                    "receiver": payment.developer.email,
                    "note": f"Payment for project: {payment.milestone.project.title}",
                    "sender_item_id": str(payment.id)
                }]
            })
            
            if payout.create():
                payment.transaction_id = payout.batch_header.payout_batch_id
                payment.gateway_response = payout.to_dict()
                payment.status = 'processing'
                payment.save()
                
                self._log_transaction(
                    payment,
                    'payment_initiated',
                    f"PayPal payout created: {payout.batch_header.payout_batch_id}"
                )
                
                return {
                    'success': True,
                    'transaction_id': payout.batch_header.payout_batch_id,
                    'status': payout.batch_header.batch_status
                }
            else:
                self._log_transaction(
                    payment,
                    'payment_failed',
                    f"PayPal payout failed: {payout.error}",
                    log_level='error'
                )
                payment.status = 'failed'
                payment.save()
                
                return {
                    'success': False,
                    'error': str(payout.error)
                }
                
        except Exception as e:
            self._log_transaction(
                payment,
                'payment_failed',
                f"PayPal error: {str(e)}",
                log_level='error'
            )
            payment.status = 'failed'
            payment.save()
            
            return {
                'success': False,
                'error': str(e)
            }
    
    def refund_payment(self, payment: Payment, amount: Optional[Decimal] = None) -> Dict:
        """PayPal doesn't support direct refunds for payouts"""
        return {
            'success': False,
            'error': 'PayPal payouts cannot be refunded directly'
        }
    
    def get_payment_status(self, transaction_id: str) -> Dict:
        """Get payout status from PayPal"""
        try:
            payout = paypalrestsdk.Payout.find(transaction_id)
            return {
                'success': True,
                'status': payout.batch_header.batch_status,
                'amount': Decimal(payout.items[0].amount.value),
                'currency': payout.items[0].amount.currency
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _log_transaction(self, payment: Payment, log_type: str, message: str, log_level: str = 'info'):
        """Log transaction details"""
        TransactionLog.objects.create(
            payment=payment,
            log_type=log_type,
            log_level=log_level,
            message=message,
            gateway_response=payment.gateway_response
        )


class PaymentProcessingService:
    """Main payment processing service"""
    
    def __init__(self):
        self.gateway_services = {
            'stripe': StripePaymentService,
            'paypal': PayPalPaymentService,
        }
    
    def get_gateway_service(self, gateway_type: str) -> PaymentGatewayService:
        """Get payment gateway service instance"""
        if gateway_type not in self.gateway_services:
            raise ValueError(f"Unsupported gateway type: {gateway_type}")
        
        gateway = PaymentGateway.objects.filter(
            gateway_type=gateway_type,
            status='active'
        ).first()
        
        if not gateway:
            raise ValueError(f"No active gateway found for type: {gateway_type}")
        
        return self.gateway_services[gateway_type](gateway)
    
    @transaction.atomic
    def process_milestone_payment(self, milestone: Milestone) -> Dict:
        """Process payment for a completed milestone"""
        try:
            # Validate milestone is ready for payment
            if not self._validate_milestone_for_payment(milestone):
                return {
                    'success': False,
                    'error': 'Milestone not ready for payment'
                }
            
            # Get team members and calculate payments
            team_payments = self._calculate_team_payments(milestone)
            
            # Process payments for each team member
            payment_results = []
            for developer, amount in team_payments.items():
                payment_result = self._process_individual_payment(
                    milestone, developer, amount
                )
                payment_results.append(payment_result)
            
            # Update milestone status
            if all(result['success'] for result in payment_results):
                milestone.status = 'paid'
                milestone.paid_date = timezone.now()
                milestone.save()
                
                return {
                    'success': True,
                    'payments': payment_results,
                    'total_amount': sum(team_payments.values())
                }
            else:
                return {
                    'success': False,
                    'error': 'Some payments failed',
                    'payments': payment_results
                }
                
        except Exception as e:
            logger.error(f"Error processing milestone payment: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _validate_milestone_for_payment(self, milestone: Milestone) -> bool:
        """Validate milestone is ready for payment"""
        return (
            milestone.status == 'completed' and
            milestone.client_approved and
            milestone.senior_developer_approved
        )
    
    def _calculate_team_payments(self, milestone: Milestone) -> Dict[User, Decimal]:
        """Calculate payment amounts for team members"""
        project = milestone.project
        team_payments = {}
        
        # Get all tasks for this milestone
        milestone_tasks = project.tasks.filter(
            completion_percentage=100,
            status='completed'
        )
        
        # Calculate total hours and individual contributions
        total_hours = sum(task.estimated_hours for task in milestone_tasks)
        milestone_amount = milestone.amount
        
        # Distribute payment based on task hours
        for task in milestone_tasks:
            if task.assigned_developer:
                developer = task.assigned_developer
                task_percentage = task.estimated_hours / total_hours if total_hours > 0 else 0
                payment_amount = milestone_amount * Decimal(str(task_percentage))
                
                if developer in team_payments:
                    team_payments[developer] += payment_amount
                else:
                    team_payments[developer] = payment_amount
        
        return team_payments
    
    def _process_individual_payment(self, milestone: Milestone, developer: User, amount: Decimal) -> Dict:
        """Process payment for individual developer"""
        try:
            # Get developer's preferred payment method
            payment_method = developer.payment_methods.filter(
                is_default=True,
                status='verified'
            ).first()
            
            if not payment_method:
                return {
                    'success': False,
                    'developer': developer.username,
                    'error': 'No verified payment method found'
                }
            
            # Calculate fees based on gateway type
            platform_fee = amount * Decimal('0.05')  # 5% platform fee
            gateway_fee = self._calculate_gateway_fee(amount, payment_method.method_type)
            net_amount = amount - platform_fee - gateway_fee
            
            # Create payment record
            payment = Payment.objects.create(
                milestone=milestone,
                developer=developer,
                amount=amount,
                platform_fee=platform_fee,
                gateway_fee=gateway_fee,
                net_amount=net_amount,
                payment_type='milestone',
                status='pending'
            )
            
            # Process through gateway
            gateway_service = self.get_gateway_service(payment_method.method_type)
            result = gateway_service.process_payment(payment)
            
            if result['success']:
                payment.status = 'processing'
                payment.processed_at = timezone.now()
                payment.save()
                
                # Update payment method usage
                payment_method.total_payments_received += net_amount
                payment_method.last_used_date = timezone.now()
                payment_method.save()
            
            return {
                'success': result['success'],
                'developer': developer.username,
                'amount': amount,
                'net_amount': net_amount,
                'payment_id': str(payment.id),
                'transaction_id': result.get('transaction_id'),
                'error': result.get('error')
            }
            
        except Exception as e:
            logger.error(f"Error processing individual payment: {str(e)}")
            return {
                'success': False,
                'developer': developer.username,
                'error': str(e)
            }
    
    def _calculate_gateway_fee(self, amount: Decimal, gateway_type: str) -> Decimal:
        """Calculate gateway-specific fees"""
        if gateway_type == 'stripe' or gateway_type == 'stripe_account':
            return amount * Decimal('0.029') + Decimal('0.30')  # Stripe fees
        elif gateway_type == 'paypal':
            return amount * Decimal('0.025')  # PayPal fees
        else:
            return Decimal('0.00')
    
    @transaction.atomic
    def process_batch_payments(self, payment_ids: List[str]) -> Dict:
        """Process multiple payments in batch"""
        try:
            payments = Payment.objects.filter(
                id__in=payment_ids,
                status='pending'
            )
            
            if not payments.exists():
                return {
                    'success': False,
                    'error': 'No valid pending payments found'
                }
            
            # Group payments by gateway type for batch processing
            payments_by_gateway = {}
            for payment in payments:
                payment_method = payment.developer.payment_methods.filter(
                    is_default=True,
                    status='verified'
                ).first()
                
                if payment_method:
                    gateway_type = payment_method.method_type
                    if gateway_type not in payments_by_gateway:
                        payments_by_gateway[gateway_type] = []
                    payments_by_gateway[gateway_type].append(payment)
            
            # Process each gateway batch
            batch_results = []
            for gateway_type, gateway_payments in payments_by_gateway.items():
                gateway_service = self.get_gateway_service(gateway_type)
                
                for payment in gateway_payments:
                    result = gateway_service.process_payment(payment)
                    batch_results.append({
                        'payment_id': str(payment.id),
                        'developer': payment.developer.username,
                        'amount': payment.amount,
                        'success': result['success'],
                        'transaction_id': result.get('transaction_id'),
                        'error': result.get('error')
                    })
            
            successful_payments = len([r for r in batch_results if r['success']])
            
            return {
                'success': True,
                'total_payments': len(batch_results),
                'successful_payments': successful_payments,
                'failed_payments': len(batch_results) - successful_payments,
                'results': batch_results
            }
            
        except Exception as e:
            logger.error(f"Error processing batch payments: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def schedule_automatic_payments(self, project_id: str) -> Dict:
        """Schedule automatic payments for project milestones"""
        try:
            from projects.models import Project
            
            project = Project.objects.get(id=project_id)
            
            # Get completed milestones ready for payment
            ready_milestones = project.milestones.filter(
                status='completed',
                client_approved=True,
                senior_developer_approved=True,
                paid_date__isnull=True
            )
            
            scheduled_payments = []
            
            for milestone in ready_milestones:
                # Schedule payment processing
                from .tasks import process_milestone_payment_async
                
                task_result = process_milestone_payment_async.delay(str(milestone.id))
                
                scheduled_payments.append({
                    'milestone_id': str(milestone.id),
                    'milestone_percentage': milestone.percentage,
                    'amount': milestone.amount,
                    'task_id': task_result.id
                })
            
            return {
                'success': True,
                'project_id': project_id,
                'scheduled_payments': len(scheduled_payments),
                'payments': scheduled_payments
            }
            
        except Exception as e:
            logger.error(f"Error scheduling automatic payments: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class PaymentDelayService:
    """Handle payment delays and project pausing"""
    
    def __init__(self):
        self.delay_thresholds = {
            'warning': 3,  # Send warning after 3 days
            'pause': 7,    # Pause project after 7 days
            'escalate': 14  # Escalate to admin after 14 days
        }
    
    def check_overdue_payments(self, dry_run: bool = False) -> Dict:
        """Check for overdue payments and take appropriate actions"""
        now = timezone.now()
        results = {
            'warnings_sent': 0,
            'projects_paused': 0,
            'escalations_created': 0,
            'actions': []
        }
        
        # Get overdue milestones at different stages
        overdue_milestones = Milestone.objects.filter(
            status='completed',
            client_approved=True,
            senior_developer_approved=True,
            paid_date__isnull=True,
            due_date__lt=now
        )
        
        for milestone in overdue_milestones:
            days_overdue = (now - milestone.due_date).days
            action_taken = None
            
            if days_overdue >= self.delay_thresholds['escalate']:
                action_taken = self._escalate_payment_delay(milestone, dry_run)
                if action_taken:
                    results['escalations_created'] += 1
            elif days_overdue >= self.delay_thresholds['pause']:
                action_taken = self._pause_project_for_payment_delay(milestone, dry_run)
                if action_taken:
                    results['projects_paused'] += 1
            elif days_overdue >= self.delay_thresholds['warning']:
                action_taken = self._send_payment_warning(milestone, dry_run)
                if action_taken:
                    results['warnings_sent'] += 1
            
            if action_taken:
                results['actions'].append({
                    'milestone_id': str(milestone.id),
                    'project_title': milestone.project.title,
                    'days_overdue': days_overdue,
                    'action': action_taken,
                    'amount': float(milestone.amount)
                })
        
        return results
    
    def _send_payment_warning(self, milestone: Milestone, dry_run: bool = False) -> str:
        """Send payment warning to client"""
        if dry_run:
            logger.info(f"[DRY RUN] Would send payment warning for milestone {milestone.id}")
            return 'warning_sent'
        
        try:
            # Create notification record
            from communications.models import Notification
            
            Notification.objects.create(
                recipient=milestone.project.client,
                title=f"Payment Due: {milestone.project.title}",
                message=f"Payment for milestone {milestone.percentage}% is overdue. "
                       f"Amount: ${milestone.amount}. Please process payment to avoid project delays.",
                notification_type='payment_warning',
                metadata={
                    'milestone_id': str(milestone.id),
                    'project_id': str(milestone.project.id),
                    'amount': float(milestone.amount)
                }
            )
            
            logger.info(f"Payment warning sent for milestone {milestone.id}")
            return 'warning_sent'
            
        except Exception as e:
            logger.error(f"Error sending payment warning: {str(e)}")
            return None
    
    def _pause_project_for_payment_delay(self, milestone: Milestone, dry_run: bool = False) -> str:
        """Pause project due to payment delay"""
        if dry_run:
            logger.info(f"[DRY RUN] Would pause project {milestone.project.id} for payment delay")
            return 'project_paused'
        
        try:
            project = milestone.project
            
            # Only pause if not already paused
            if project.status != 'paused_payment':
                # Store original status for restoration
                original_status = project.status
                project.status = 'paused_payment'
                project.save()
                
                # Create pause record
                self._create_project_pause_record(project, milestone, original_status)
                
                # Notify team members
                self._notify_team_of_payment_delay(project, milestone)
                
                logger.warning(f"Project {project.id} paused due to payment delay for milestone {milestone.id}")
                return 'project_paused'
            
        except Exception as e:
            logger.error(f"Error pausing project: {str(e)}")
            return None
    
    def _escalate_payment_delay(self, milestone: Milestone, dry_run: bool = False) -> str:
        """Escalate payment delay to admin"""
        if dry_run:
            logger.info(f"[DRY RUN] Would escalate payment delay for milestone {milestone.id}")
            return 'escalated'
        
        try:
            # Create dispute record for admin review
            PaymentDispute.objects.create(
                payment=milestone.payments.first() if milestone.payments.exists() else None,
                initiated_by=milestone.project.client,  # System-initiated
                disputed_against=milestone.project.client,
                dispute_type='payment_delay',
                title=f"Payment Delay Escalation: {milestone.project.title}",
                description=f"Milestone {milestone.percentage}% payment has been overdue for more than "
                           f"{self.delay_thresholds['escalate']} days. Amount: ${milestone.amount}",
                disputed_amount=milestone.amount,
                status='opened',
                priority='high'
            )
            
            # Notify admins
            self._notify_admins_of_escalation(milestone)
            
            logger.error(f"Payment delay escalated for milestone {milestone.id}")
            return 'escalated'
            
        except Exception as e:
            logger.error(f"Error escalating payment delay: {str(e)}")
            return None
    
    def _create_project_pause_record(self, project: Project, milestone: Milestone, original_status: str):
        """Create record of project pause for tracking"""
        try:
            # Store pause information in project metadata
            pause_record = {
                'paused_at': timezone.now().isoformat(),
                'reason': 'payment_delay',
                'milestone_id': str(milestone.id),
                'original_status': original_status,
                'amount_overdue': float(milestone.amount)
            }
            
            logger.info(f"Project pause record created: {pause_record}")
            
        except Exception as e:
            logger.error(f"Error creating pause record: {str(e)}")
    
    def _notify_team_of_payment_delay(self, project: Project, milestone: Milestone):
        """Notify team members about payment delay"""
        try:
            from communications.models import Notification
            
            # Get all team members
            team_members = User.objects.filter(
                assigned_tasks__project=project
            ).distinct()
            
            for member in team_members:
                Notification.objects.create(
                    recipient=member,
                    title=f"Project Paused: {project.title}",
                    message=f"Project has been paused due to overdue payment. "
                           f"Milestone {milestone.percentage}% payment is overdue. "
                           f"Work will resume once payment is processed.",
                    notification_type='project_paused',
                    metadata={
                        'project_id': str(project.id),
                        'milestone_id': str(milestone.id),
                        'reason': 'payment_delay'
                    }
                )
            
            logger.info(f"Team notified of payment delay for project {project.id}")
            
        except Exception as e:
            logger.error(f"Error notifying team: {str(e)}")
    
    def _notify_admins_of_escalation(self, milestone: Milestone):
        """Notify administrators of payment escalation"""
        try:
            from communications.models import Notification
            
            # Get admin users
            admin_users = User.objects.filter(role='admin', is_active=True)
            
            for admin in admin_users:
                Notification.objects.create(
                    recipient=admin,
                    title=f"Payment Escalation: {milestone.project.title}",
                    message=f"Payment for milestone {milestone.percentage}% has been overdue for more than "
                           f"{self.delay_thresholds['escalate']} days. Amount: ${milestone.amount}. "
                           f"Manual intervention required.",
                    notification_type='payment_escalation',
                    priority='high',
                    metadata={
                        'milestone_id': str(milestone.id),
                        'project_id': str(milestone.project.id),
                        'amount': float(milestone.amount),
                        'days_overdue': (timezone.now() - milestone.due_date).days
                    }
                )
            
            logger.info(f"Admins notified of payment escalation for milestone {milestone.id}")
            
        except Exception as e:
            logger.error(f"Error notifying admins: {str(e)}")
    
    def resume_project_after_payment(self, project_id: str) -> Dict:
        """Resume project after payment is received"""
        try:
            project = Project.objects.get(id=project_id)
            
            if project.status == 'paused_payment':
                # Resume project to original status
                project.status = 'active'  # Default resume status
                project.save()
                
                # Notify team members
                self._notify_team_of_project_resume(project)
                
                logger.info(f"Project {project_id} resumed after payment")
                
                return {
                    'success': True,
                    'project_id': project_id,
                    'message': 'Project resumed successfully'
                }
            else:
                return {
                    'success': False,
                    'error': 'Project is not paused for payment'
                }
                
        except Project.DoesNotExist:
            return {
                'success': False,
                'error': 'Project not found'
            }
        except Exception as e:
            logger.error(f"Error resuming project: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _notify_team_of_project_resume(self, project: Project):
        """Notify team members that project has resumed"""
        try:
            from communications.models import Notification
            
            # Get all team members
            team_members = User.objects.filter(
                assigned_tasks__project=project
            ).distinct()
            
            for member in team_members:
                Notification.objects.create(
                    recipient=member,
                    title=f"Project Resumed: {project.title}",
                    message=f"Project has been resumed. Payment has been received and work can continue.",
                    notification_type='project_resumed',
                    metadata={
                        'project_id': str(project.id)
                    }
                )
            
            logger.info(f"Team notified of project resume for project {project.id}")
            
        except Exception as e:
            logger.error(f"Error notifying team of resume: {str(e)}")


class PaymentReconciliationService:
    """Service for reconciling payments with external gateways"""
    
    def __init__(self):
        self.gateway_services = {
            'stripe': StripePaymentService,
            'paypal': PayPalPaymentService,
        }
    
    def reconcile_gateway_transactions(self, gateway_type: str) -> Dict:
        """Reconcile transactions with payment gateway"""
        try:
            gateway = PaymentGateway.objects.filter(
                gateway_type=gateway_type,
                status='active'
            ).first()
            
            if not gateway:
                return {
                    'success': False,
                    'error': f'No active gateway found for type: {gateway_type}'
                }
            
            # Get payments from the last 30 days for reconciliation
            thirty_days_ago = timezone.now() - timedelta(days=30)
            payments = Payment.objects.filter(
                payment_gateway=gateway,
                created_at__gte=thirty_days_ago,
                transaction_id__isnull=False
            )
            
            reconciliation_results = {
                'gateway_type': gateway_type,
                'total_payments_checked': payments.count(),
                'mismatches': 0,
                'updated_payments': 0,
                'errors': [],
                'details': []
            }
            
            gateway_service = self.gateway_services[gateway_type](gateway)
            
            for payment in payments:
                try:
                    # Get status from gateway
                    gateway_status = gateway_service.get_payment_status(payment.transaction_id)
                    
                    if gateway_status['success']:
                        gateway_payment_status = gateway_status.get('status')
                        
                        # Map gateway status to our status
                        mapped_status = self._map_gateway_status(gateway_payment_status, gateway_type)
                        
                        if mapped_status != payment.status:
                            # Status mismatch found
                            reconciliation_results['mismatches'] += 1
                            
                            # Update payment status
                            old_status = payment.status
                            payment.status = mapped_status
                            payment.save()
                            
                            reconciliation_results['updated_payments'] += 1
                            reconciliation_results['details'].append({
                                'payment_id': str(payment.id),
                                'old_status': old_status,
                                'new_status': mapped_status,
                                'gateway_status': gateway_payment_status,
                                'amount': float(payment.amount)
                            })
                            
                            # Log the reconciliation
                            TransactionLog.objects.create(
                                payment=payment,
                                log_type='payment_reconciled',
                                log_level='info',
                                message=f'Payment status updated from {old_status} to {mapped_status} during reconciliation',
                                gateway_response=gateway_status
                            )
                    
                except Exception as e:
                    reconciliation_results['errors'].append({
                        'payment_id': str(payment.id),
                        'error': str(e)
                    })
                    logger.error(f"Error reconciling payment {payment.id}: {str(e)}")
            
            logger.info(f"Reconciliation completed for {gateway_type}: {reconciliation_results['mismatches']} mismatches found")
            
            return {
                'success': True,
                **reconciliation_results
            }
            
        except Exception as e:
            logger.error(f"Error in gateway reconciliation: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _map_gateway_status(self, gateway_status: str, gateway_type: str) -> str:
        """Map gateway-specific status to our payment status"""
        if gateway_type == 'stripe':
            status_mapping = {
                'requires_payment_method': 'pending',
                'requires_confirmation': 'pending',
                'requires_action': 'pending',
                'processing': 'processing',
                'requires_capture': 'processing',
                'canceled': 'cancelled',
                'succeeded': 'completed'
            }
        elif gateway_type == 'paypal':
            status_mapping = {
                'CREATED': 'pending',
                'PENDING': 'processing',
                'SUCCESS': 'completed',
                'FAILED': 'failed',
                'CANCELED': 'cancelled',
                'DENIED': 'failed'
            }
        else:
            return 'pending'  # Default fallback
        
        return status_mapping.get(gateway_status, 'pending')
    
    def generate_payment_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """Generate comprehensive payment report"""
        try:
            payments = Payment.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            
            # Calculate summary statistics
            total_payments = payments.count()
            total_amount = sum(p.amount for p in payments if p.status == 'completed')
            total_platform_fees = sum(p.platform_fee for p in payments if p.status == 'completed')
            total_gateway_fees = sum(p.gateway_fee for p in payments if p.status == 'completed')
            net_amount_paid = sum(p.net_amount for p in payments if p.status == 'completed')
            
            # Status breakdown
            status_breakdown = {}
            for status in ['pending', 'processing', 'completed', 'failed', 'cancelled']:
                status_breakdown[status] = payments.filter(status=status).count()
            
            # Gateway breakdown
            gateway_breakdown = {}
            for gateway_type in ['stripe', 'paypal']:
                gateway_payments = payments.filter(payment_gateway__gateway_type=gateway_type)
                gateway_breakdown[gateway_type] = {
                    'count': gateway_payments.count(),
                    'amount': sum(p.amount for p in gateway_payments if p.status == 'completed'),
                    'fees': sum(p.gateway_fee for p in gateway_payments if p.status == 'completed')
                }
            
            # Monthly breakdown
            monthly_breakdown = {}
            for payment in payments.filter(status='completed'):
                month_key = payment.created_at.strftime('%Y-%m')
                if month_key not in monthly_breakdown:
                    monthly_breakdown[month_key] = {
                        'count': 0,
                        'amount': 0,
                        'fees': 0
                    }
                monthly_breakdown[month_key]['count'] += 1
                monthly_breakdown[month_key]['amount'] += float(payment.amount)
                monthly_breakdown[month_key]['fees'] += float(payment.platform_fee + payment.gateway_fee)
            
            report = {
                'period': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'summary': {
                    'total_payments': total_payments,
                    'total_amount': float(total_amount),
                    'total_platform_fees': float(total_platform_fees),
                    'total_gateway_fees': float(total_gateway_fees),
                    'net_amount_paid': float(net_amount_paid)
                },
                'status_breakdown': status_breakdown,
                'gateway_breakdown': gateway_breakdown,
                'monthly_breakdown': monthly_breakdown,
                'generated_at': timezone.now().isoformat()
            }
            
            logger.info(f"Payment report generated for period {start_date} to {end_date}")
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating payment report: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class WebhookService:
    """Service for handling payment gateway webhooks"""
    
    def __init__(self):
        self.webhook_handlers = {
            'stripe': self._handle_stripe_event,
            'paypal': self._handle_paypal_event
        }
    
    def handle_stripe_webhook(self, payload: Dict, signature: str) -> Dict:
        """Handle Stripe webhook events"""
        try:
            import stripe
            
            # Verify webhook signature
            try:
                event = stripe.Webhook.construct_event(
                    json.dumps(payload),
                    signature,
                    settings.STRIPE_WEBHOOK_SECRET
                )
            except ValueError:
                logger.error("Invalid Stripe webhook payload")
                return {'success': False, 'error': 'Invalid payload'}
            except stripe.error.SignatureVerificationError:
                logger.error("Invalid Stripe webhook signature")
                return {'success': False, 'error': 'Invalid signature'}
            
            # Handle the event
            result = self._handle_stripe_event(event)
            
            logger.info(f"Stripe webhook processed: {event['type']}")
            return result
            
        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def handle_paypal_webhook(self, payload: Dict, headers: Dict) -> Dict:
        """Handle PayPal webhook events"""
        try:
            # In a real implementation, you would verify the PayPal webhook signature
            # For now, we'll process the event directly
            
            result = self._handle_paypal_event(payload)
            
            logger.info(f"PayPal webhook processed: {payload.get('event_type', 'unknown')}")
            return result
            
        except Exception as e:
            logger.error(f"Error handling PayPal webhook: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_stripe_event(self, event: Dict) -> Dict:
        """Handle specific Stripe events"""
        event_type = event['type']
        event_data = event['data']['object']
        
        try:
            if event_type == 'payment_intent.succeeded':
                return self._handle_payment_success(event_data, 'stripe')
            elif event_type == 'payment_intent.payment_failed':
                return self._handle_payment_failure(event_data, 'stripe')
            elif event_type == 'charge.dispute.created':
                return self._handle_dispute_created(event_data, 'stripe')
            else:
                logger.info(f"Unhandled Stripe event type: {event_type}")
                return {'success': True, 'message': 'Event acknowledged but not processed'}
                
        except Exception as e:
            logger.error(f"Error handling Stripe event {event_type}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_paypal_event(self, event: Dict) -> Dict:
        """Handle specific PayPal events"""
        event_type = event.get('event_type', '')
        
        try:
            if event_type == 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED':
                return self._handle_payout_success(event, 'paypal')
            elif event_type == 'PAYMENT.PAYOUTS-ITEM.FAILED':
                return self._handle_payout_failure(event, 'paypal')
            else:
                logger.info(f"Unhandled PayPal event type: {event_type}")
                return {'success': True, 'message': 'Event acknowledged but not processed'}
                
        except Exception as e:
            logger.error(f"Error handling PayPal event {event_type}: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_payment_success(self, payment_data: Dict, gateway_type: str) -> Dict:
        """Handle successful payment"""
        try:
            # Find payment by transaction ID
            transaction_id = payment_data.get('id')
            payment = Payment.objects.filter(transaction_id=transaction_id).first()
            
            if payment:
                payment.status = 'completed'
                payment.processed_at = timezone.now()
                payment.gateway_response = payment_data
                payment.save()
                
                # Log the success
                TransactionLog.objects.create(
                    payment=payment,
                    log_type='payment_completed',
                    log_level='info',
                    message=f'Payment completed via {gateway_type} webhook',
                    gateway_response=payment_data
                )
                
                # Update payment method usage
                if payment.developer.payment_methods.filter(is_default=True).exists():
                    payment_method = payment.developer.payment_methods.filter(is_default=True).first()
                    payment_method.total_payments_received += payment.net_amount
                    payment_method.last_used_date = timezone.now()
                    payment_method.save()
                
                logger.info(f"Payment {payment.id} marked as completed via webhook")
                
                return {'success': True, 'payment_id': str(payment.id)}
            else:
                logger.warning(f"Payment not found for transaction ID: {transaction_id}")
                return {'success': False, 'error': 'Payment not found'}
                
        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_payment_failure(self, payment_data: Dict, gateway_type: str) -> Dict:
        """Handle failed payment"""
        try:
            # Find payment by transaction ID
            transaction_id = payment_data.get('id')
            payment = Payment.objects.filter(transaction_id=transaction_id).first()
            
            if payment:
                payment.status = 'failed'
                payment.gateway_response = payment_data
                payment.save()
                
                # Log the failure
                error_message = payment_data.get('last_payment_error', {}).get('message', 'Payment failed')
                TransactionLog.objects.create(
                    payment=payment,
                    log_type='payment_failed',
                    log_level='error',
                    message=f'Payment failed via {gateway_type} webhook: {error_message}',
                    gateway_response=payment_data,
                    error_message=error_message
                )
                
                logger.warning(f"Payment {payment.id} marked as failed via webhook")
                
                return {'success': True, 'payment_id': str(payment.id)}
            else:
                logger.warning(f"Payment not found for transaction ID: {transaction_id}")
                return {'success': False, 'error': 'Payment not found'}
                
        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_payout_success(self, event_data: Dict, gateway_type: str) -> Dict:
        """Handle successful PayPal payout"""
        try:
            # Extract payout item data
            payout_item = event_data.get('resource', {})
            payout_item_id = payout_item.get('payout_item_id')
            
            # Find payment by metadata or transaction ID
            payment = Payment.objects.filter(
                transaction_id__contains=payout_item_id
            ).first()
            
            if payment:
                payment.status = 'completed'
                payment.processed_at = timezone.now()
                payment.gateway_response = event_data
                payment.save()
                
                # Log the success
                TransactionLog.objects.create(
                    payment=payment,
                    log_type='payment_completed',
                    log_level='info',
                    message=f'Payout completed via {gateway_type} webhook',
                    gateway_response=event_data
                )
                
                logger.info(f"Payout {payment.id} marked as completed via webhook")
                
                return {'success': True, 'payment_id': str(payment.id)}
            else:
                logger.warning(f"Payment not found for payout item ID: {payout_item_id}")
                return {'success': False, 'error': 'Payment not found'}
                
        except Exception as e:
            logger.error(f"Error handling payout success: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_payout_failure(self, event_data: Dict, gateway_type: str) -> Dict:
        """Handle failed PayPal payout"""
        try:
            # Extract payout item data
            payout_item = event_data.get('resource', {})
            payout_item_id = payout_item.get('payout_item_id')
            
            # Find payment by metadata or transaction ID
            payment = Payment.objects.filter(
                transaction_id__contains=payout_item_id
            ).first()
            
            if payment:
                payment.status = 'failed'
                payment.gateway_response = event_data
                payment.save()
                
                # Log the failure
                error_message = payout_item.get('errors', [{}])[0].get('message', 'Payout failed')
                TransactionLog.objects.create(
                    payment=payment,
                    log_type='payment_failed',
                    log_level='error',
                    message=f'Payout failed via {gateway_type} webhook: {error_message}',
                    gateway_response=event_data,
                    error_message=error_message
                )
                
                logger.warning(f"Payout {payment.id} marked as failed via webhook")
                
                return {'success': True, 'payment_id': str(payment.id)}
            else:
                logger.warning(f"Payment not found for payout item ID: {payout_item_id}")
                return {'success': False, 'error': 'Payment not found'}
                
        except Exception as e:
            logger.error(f"Error handling payout failure: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_dispute_created(self, dispute_data: Dict, gateway_type: str) -> Dict:
        """Handle dispute creation"""
        try:
            # Find payment by charge ID
            charge_id = dispute_data.get('charge')
            payment = Payment.objects.filter(
                gateway_response__id=charge_id
            ).first()
            
            if payment:
                # Create dispute record
                PaymentDispute.objects.create(
                    payment=payment,
                    initiated_by=payment.milestone.project.client,  # Assume client initiated
                    disputed_against=payment.developer,
                    dispute_type='unauthorized_charge',
                    title=f"Gateway Dispute: {payment.milestone.project.title}",
                    description=f"Dispute created via {gateway_type} for payment {payment.id}",
                    disputed_amount=payment.amount,
                    status='opened',
                    priority='high'
                )
                
                logger.warning(f"Dispute created for payment {payment.id} via webhook")
                
                return {'success': True, 'payment_id': str(payment.id)}
            else:
                logger.warning(f"Payment not found for charge ID: {charge_id}")
                return {'success': False, 'error': 'Payment not found'}
                
        except Exception as e:
            logger.error(f"Error handling dispute creation: {str(e)}")
            return {'success': False, 'error': str(e)}
