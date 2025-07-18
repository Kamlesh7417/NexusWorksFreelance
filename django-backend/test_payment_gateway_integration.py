#!/usr/bin/env python
"""
Comprehensive test for payment gateway integration and processing
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from payments.models import (
    Payment, PaymentGateway, Milestone, PaymentMethod, 
    PaymentDispute, TransactionLog
)
from payments.services import (
    PaymentProcessingService, StripePaymentService, PayPalPaymentService,
    PaymentDelayService, PaymentReconciliationService, WebhookService
)
from projects.models import Project, Task
from users.models import User

User = get_user_model()


class PaymentGatewayIntegrationTest(TestCase):
    """Test payment gateway integration functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Create test users
        self.client_user = User.objects.create_user(
            username='testclient',
            email='client@test.com',
            role='client'
        )
        
        self.developer_user = User.objects.create_user(
            username='testdev',
            email='dev@test.com',
            role='developer'
        )
        
        self.senior_dev_user = User.objects.create_user(
            username='seniordev',
            email='senior@test.com',
            role='developer'
        )
        
        # Create test project
        self.project = Project.objects.create(
            title='Test Project',
            description='Test project for payment integration',
            client=self.client_user,
            budget_estimate=Decimal('5000.00'),
            status='active',
            senior_developer=self.senior_dev_user
        )
        
        # Create test task
        self.task = Task.objects.create(
            project=self.project,
            title='Test Task',
            description='Test task for payment',
            estimated_hours=40,
            assigned_developer=self.developer_user,
            status='completed',
            completion_percentage=100
        )
        
        # Create test milestone
        self.milestone = Milestone.objects.create(
            project=self.project,
            percentage=25,
            amount=Decimal('1250.00'),
            status='completed',
            due_date=timezone.now() + timedelta(days=7),
            client_approved=True,
            senior_developer_approved=True
        )
        
        # Create payment gateways
        self.stripe_gateway = PaymentGateway.objects.create(
            name='Stripe Test',
            gateway_type='stripe',
            status='active',
            api_endpoint='https://api.stripe.com',
            transaction_fee_percentage=Decimal('0.029'),
            transaction_fee_fixed=Decimal('0.30'),
            supports_refunds=True
        )
        
        self.paypal_gateway = PaymentGateway.objects.create(
            name='PayPal Test',
            gateway_type='paypal',
            status='active',
            api_endpoint='https://api.paypal.com',
            transaction_fee_percentage=Decimal('0.025'),
            supports_refunds=False
        )
        
        # Create payment method for developer
        self.payment_method = PaymentMethod.objects.create(
            user=self.developer_user,
            method_type='stripe_account',
            status='verified',
            is_default=True,
            display_name='Test Stripe Account',
            verification_status='verified'
        )
    
    def test_stripe_payment_processing(self):
        """Test Stripe payment processing"""
        print("Testing Stripe payment processing...")
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1250.00'),
            platform_fee=Decimal('62.50'),
            gateway_fee=Decimal('36.55'),
            net_amount=Decimal('1150.95'),
            payment_gateway=self.stripe_gateway,
            status='pending'
        )
        
        # Mock Stripe API
        with patch('stripe.PaymentIntent.create') as mock_create:
            mock_intent = Mock()
            mock_intent.id = 'pi_test123'
            mock_intent.client_secret = 'pi_test123_secret'
            mock_intent.status = 'requires_payment_method'
            mock_create.return_value = mock_intent
            
            # Test payment processing
            stripe_service = StripePaymentService(self.stripe_gateway)
            result = stripe_service.process_payment(payment)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['transaction_id'], 'pi_test123')
            
            # Verify payment was updated
            payment.refresh_from_db()
            self.assertEqual(payment.transaction_id, 'pi_test123')
            self.assertEqual(payment.status, 'processing')
        
        print("✓ Stripe payment processing test passed")
    
    def test_paypal_payment_processing(self):
        """Test PayPal payment processing"""
        print("Testing PayPal payment processing...")
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1250.00'),
            platform_fee=Decimal('62.50'),
            gateway_fee=Decimal('31.25'),
            net_amount=Decimal('1156.25'),
            payment_gateway=self.paypal_gateway,
            status='pending'
        )
        
        # Mock PayPal API
        with patch('paypalrestsdk.Payout') as mock_payout_class:
            mock_payout = Mock()
            mock_payout.create.return_value = True
            mock_payout.batch_header.payout_batch_id = 'PAYOUT123'
            mock_payout.batch_header.batch_status = 'PENDING'
            mock_payout.to_dict.return_value = {'batch_id': 'PAYOUT123'}
            mock_payout_class.return_value = mock_payout
            
            # Test payment processing
            paypal_service = PayPalPaymentService(self.paypal_gateway)
            result = paypal_service.process_payment(payment)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['transaction_id'], 'PAYOUT123')
            
            # Verify payment was updated
            payment.refresh_from_db()
            self.assertEqual(payment.transaction_id, 'PAYOUT123')
            self.assertEqual(payment.status, 'processing')
        
        print("✓ PayPal payment processing test passed")
    
    def test_milestone_payment_processing(self):
        """Test complete milestone payment processing"""
        print("Testing milestone payment processing...")
        
        payment_service = PaymentProcessingService()
        
        # Mock gateway services
        with patch.object(payment_service, 'get_gateway_service') as mock_get_service:
            mock_gateway_service = Mock()
            mock_gateway_service.process_payment.return_value = {
                'success': True,
                'transaction_id': 'test_transaction_123'
            }
            mock_get_service.return_value = mock_gateway_service
            
            # Process milestone payment
            result = payment_service.process_milestone_payment(self.milestone)
            
            self.assertTrue(result['success'])
            self.assertIn('payments', result)
            self.assertEqual(result['total_amount'], Decimal('1250.00'))
            
            # Verify milestone status updated
            self.milestone.refresh_from_db()
            self.assertEqual(self.milestone.status, 'paid')
            self.assertIsNotNone(self.milestone.paid_date)
        
        print("✓ Milestone payment processing test passed")
    
    def test_payment_delay_handling(self):
        """Test payment delay handling and project pausing"""
        print("Testing payment delay handling...")
        
        # Create overdue milestone
        overdue_milestone = Milestone.objects.create(
            project=self.project,
            percentage=50,
            amount=Decimal('2500.00'),
            status='completed',
            due_date=timezone.now() - timedelta(days=10),  # 10 days overdue
            client_approved=True,
            senior_developer_approved=True
        )
        
        delay_service = PaymentDelayService()
        
        # Mock notification creation
        with patch('communications.models.Notification.objects.create') as mock_notification:
            # Check overdue payments
            results = delay_service.check_overdue_payments(dry_run=True)
            
            self.assertGreater(results['escalations_created'], 0)
            self.assertIn('actions', results)
        
        print("✓ Payment delay handling test passed")
    
    def test_payment_reconciliation(self):
        """Test payment reconciliation with gateways"""
        print("Testing payment reconciliation...")
        
        # Create payment with transaction ID
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1250.00'),
            platform_fee=Decimal('62.50'),
            gateway_fee=Decimal('36.55'),
            net_amount=Decimal('1150.95'),
            payment_gateway=self.stripe_gateway,
            status='processing',
            transaction_id='pi_test123'
        )
        
        reconciliation_service = PaymentReconciliationService()
        
        # Mock gateway service
        with patch.object(reconciliation_service, 'gateway_services') as mock_services:
            mock_gateway_service = Mock()
            mock_gateway_service.get_payment_status.return_value = {
                'success': True,
                'status': 'succeeded'
            }
            mock_services.__getitem__.return_value = lambda gateway: mock_gateway_service
            
            # Reconcile transactions
            result = reconciliation_service.reconcile_gateway_transactions('stripe')
            
            self.assertTrue(result['success'])
            self.assertEqual(result['gateway_type'], 'stripe')
            self.assertGreaterEqual(result['total_payments_checked'], 1)
        
        print("✓ Payment reconciliation test passed")
    
    def test_webhook_handling(self):
        """Test webhook event handling"""
        print("Testing webhook handling...")
        
        # Create payment for webhook testing
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1250.00'),
            platform_fee=Decimal('62.50'),
            gateway_fee=Decimal('36.55'),
            net_amount=Decimal('1150.95'),
            payment_gateway=self.stripe_gateway,
            status='processing',
            transaction_id='pi_test123'
        )
        
        webhook_service = WebhookService()
        
        # Test Stripe webhook
        stripe_event = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_test123',
                    'status': 'succeeded',
                    'amount': 125000  # Amount in cents
                }
            }
        }
        
        with patch('stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = stripe_event
            
            result = webhook_service.handle_stripe_webhook(stripe_event, 'test_signature')
            
            self.assertTrue(result['success'])
            
            # Verify payment status updated
            payment.refresh_from_db()
            self.assertEqual(payment.status, 'completed')
            self.assertIsNotNone(payment.processed_at)
        
        print("✓ Webhook handling test passed")
    
    def test_batch_payment_processing(self):
        """Test batch payment processing"""
        print("Testing batch payment processing...")
        
        # Create multiple payments
        payments = []
        for i in range(3):
            payment = Payment.objects.create(
                milestone=self.milestone,
                developer=self.developer_user,
                amount=Decimal('416.67'),  # Split milestone amount
                platform_fee=Decimal('20.83'),
                gateway_fee=Decimal('12.18'),
                net_amount=Decimal('383.66'),
                payment_gateway=self.stripe_gateway,
                status='pending'
            )
            payments.append(str(payment.id))
        
        payment_service = PaymentProcessingService()
        
        # Mock gateway service
        with patch.object(payment_service, 'get_gateway_service') as mock_get_service:
            mock_gateway_service = Mock()
            mock_gateway_service.process_payment.return_value = {
                'success': True,
                'transaction_id': f'test_batch_{i}'
            }
            mock_get_service.return_value = mock_gateway_service
            
            # Process batch payments
            result = payment_service.process_batch_payments(payments)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['total_payments'], 3)
            self.assertEqual(result['successful_payments'], 3)
        
        print("✓ Batch payment processing test passed")
    
    def test_payment_dispute_creation(self):
        """Test payment dispute creation and handling"""
        print("Testing payment dispute creation...")
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1250.00'),
            platform_fee=Decimal('62.50'),
            gateway_fee=Decimal('36.55'),
            net_amount=Decimal('1150.95'),
            payment_gateway=self.stripe_gateway,
            status='completed'
        )
        
        # Create dispute
        dispute = PaymentDispute.objects.create(
            payment=payment,
            initiated_by=self.client_user,
            disputed_against=self.developer_user,
            dispute_type='quality_issue',
            title='Work Quality Dispute',
            description='Work does not meet requirements',
            disputed_amount=Decimal('1250.00'),
            status='opened',
            priority='medium'
        )
        
        self.assertEqual(dispute.status, 'opened')
        self.assertEqual(dispute.disputed_amount, Decimal('1250.00'))
        
        print("✓ Payment dispute creation test passed")
    
    def test_payment_method_management(self):
        """Test payment method management"""
        print("Testing payment method management...")
        
        # Test payment method creation
        new_method = PaymentMethod.objects.create(
            user=self.developer_user,
            method_type='paypal',
            status='pending_verification',
            display_name='PayPal Account',
            verification_status='pending'
        )
        
        self.assertEqual(new_method.status, 'pending_verification')
        self.assertFalse(new_method.is_default)
        
        # Test setting as default
        new_method.is_default = True
        new_method.save()
        
        # Verify old default is updated
        self.payment_method.refresh_from_db()
        self.assertFalse(self.payment_method.is_default)
        
        print("✓ Payment method management test passed")
    
    def test_payment_analytics_generation(self):
        """Test payment analytics and reporting"""
        print("Testing payment analytics generation...")
        
        # Create some test payments
        for i in range(5):
            Payment.objects.create(
                milestone=self.milestone,
                developer=self.developer_user,
                amount=Decimal('250.00'),
                platform_fee=Decimal('12.50'),
                gateway_fee=Decimal('7.25'),
                net_amount=Decimal('230.25'),
                payment_gateway=self.stripe_gateway,
                status='completed',
                processed_at=timezone.now()
            )
        
        reconciliation_service = PaymentReconciliationService()
        
        # Generate payment report
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        report = reconciliation_service.generate_payment_report(start_date, end_date)
        
        self.assertIn('summary', report)
        self.assertIn('status_breakdown', report)
        self.assertIn('gateway_breakdown', report)
        self.assertGreater(report['summary']['total_payments'], 0)
        
        print("✓ Payment analytics generation test passed")


def run_payment_gateway_tests():
    """Run all payment gateway integration tests"""
    print("=" * 60)
    print("PAYMENT GATEWAY INTEGRATION TESTS")
    print("=" * 60)
    
    # Create test suite
    test_suite = PaymentGatewayIntegrationTest()
    test_suite.setUp()
    
    try:
        # Run individual tests
        test_suite.test_stripe_payment_processing()
        test_suite.test_paypal_payment_processing()
        test_suite.test_milestone_payment_processing()
        test_suite.test_payment_delay_handling()
        test_suite.test_payment_reconciliation()
        test_suite.test_webhook_handling()
        test_suite.test_batch_payment_processing()
        test_suite.test_payment_dispute_creation()
        test_suite.test_payment_method_management()
        test_suite.test_payment_analytics_generation()
        
        print("\n" + "=" * 60)
        print("✅ ALL PAYMENT GATEWAY INTEGRATION TESTS PASSED!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = run_payment_gateway_tests()
    sys.exit(0 if success else 1)