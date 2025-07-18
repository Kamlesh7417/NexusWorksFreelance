#!/usr/bin/env python
"""
Comprehensive test for complete payment gateway integration and processing
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')
django.setup()

from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from payments.models import (
    Payment, PaymentGateway, TransactionLog, PaymentDispute, 
    PaymentMethod, Milestone
)
from payments.services import (
    PaymentProcessingService, StripePaymentService, PayPalPaymentService,
    PaymentDelayService, PaymentReconciliationService, WebhookService
)
from projects.models import Project, Task
from users.models import User

User = get_user_model()


class PaymentGatewayIntegrationTest(TestCase):
    """Test complete payment gateway integration"""
    
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
        
        # Create test project
        self.project = Project.objects.create(
            title='Test Project',
            description='Test project for payment integration',
            client=self.client_user,
            status='active',
            budget_estimate=Decimal('5000.00')
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
            method_type='stripe',
            status='verified',
            is_default=True,
            display_name='Test Stripe Account',
            verification_status='verified',
            verification_date=timezone.now()
        )
    
    def test_stripe_payment_processing(self):
        """Test Stripe payment processing"""
        print("\n=== Testing Stripe Payment Processing ===")
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1000.00'),
            platform_fee=Decimal('50.00'),
            gateway_fee=Decimal('29.30'),
            net_amount=Decimal('920.70'),
            payment_gateway=self.stripe_gateway,
            payment_type='milestone',
            status='pending'
        )
        
        # Mock Stripe API
        with patch('stripe.PaymentIntent.create') as mock_create:
            mock_intent = Mock()
            mock_intent.id = 'pi_test123'
            mock_intent.client_secret = 'pi_test123_secret'
            mock_intent.status = 'requires_confirmation'
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
            
            print(f"✓ Stripe payment created: {result['transaction_id']}")
    
    def test_paypal_payment_processing(self):
        """Test PayPal payment processing"""
        print("\n=== Testing PayPal Payment Processing ===")
        
        # Update payment method to PayPal
        self.payment_method.method_type = 'paypal'
        self.payment_method.save()
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1000.00'),
            platform_fee=Decimal('50.00'),
            gateway_fee=Decimal('25.00'),
            net_amount=Decimal('925.00'),
            payment_gateway=self.paypal_gateway,
            payment_type='milestone',
            status='pending'
        )
        
        # Mock PayPal API
        with patch('paypalrestsdk.Payout') as mock_payout_class:
            mock_payout = Mock()
            mock_payout.create.return_value = True
            mock_payout.batch_header.payout_batch_id = 'PAYOUTBATCH123'
            mock_payout.batch_header.batch_status = 'PENDING'
            mock_payout.to_dict.return_value = {'batch_id': 'PAYOUTBATCH123'}
            mock_payout_class.return_value = mock_payout
            
            # Test payment processing
            paypal_service = PayPalPaymentService(self.paypal_gateway)
            result = paypal_service.process_payment(payment)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['transaction_id'], 'PAYOUTBATCH123')
            
            # Verify payment was updated
            payment.refresh_from_db()
            self.assertEqual(payment.transaction_id, 'PAYOUTBATCH123')
            self.assertEqual(payment.status, 'processing')
            
            print(f"✓ PayPal payout created: {result['transaction_id']}")
    
    def test_milestone_payment_processing(self):
        """Test complete milestone payment processing"""
        print("\n=== Testing Milestone Payment Processing ===")
        
        # Mock Stripe API for payment processing
        with patch('stripe.PaymentIntent.create') as mock_create:
            mock_intent = Mock()
            mock_intent.id = 'pi_milestone123'
            mock_intent.client_secret = 'pi_milestone123_secret'
            mock_intent.status = 'requires_confirmation'
            mock_create.return_value = mock_intent
            
            # Process milestone payment
            payment_service = PaymentProcessingService()
            result = payment_service.process_milestone_payment(self.milestone)
            
            self.assertTrue(result['success'])
            self.assertEqual(len(result['payments']), 1)
            self.assertEqual(result['total_amount'], Decimal('1250.00'))
            
            # Verify milestone status updated
            self.milestone.refresh_from_db()
            self.assertEqual(self.milestone.status, 'paid')
            self.assertIsNotNone(self.milestone.paid_date)
            
            print(f"✓ Milestone payment processed: ${result['total_amount']}")
    
    def test_payment_delay_handling(self):
        """Test payment delay handling and project pausing"""
        print("\n=== Testing Payment Delay Handling ===")
        
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
        
        # Test delay service
        delay_service = PaymentDelayService()
        results = delay_service.check_overdue_payments(dry_run=True)
        
        self.assertGreater(results['escalations_created'], 0)
        self.assertEqual(len(results['actions']), 1)
        
        action = results['actions'][0]
        self.assertEqual(action['milestone_id'], str(overdue_milestone.id))
        self.assertEqual(action['action'], 'escalated')
        self.assertEqual(action['days_overdue'], 10)
        
        print(f"✓ Payment delay detected: {action['days_overdue']} days overdue")
    
    def test_payment_reconciliation(self):
        """Test payment reconciliation with gateways"""
        print("\n=== Testing Payment Reconciliation ===")
        
        # Create payment with transaction ID
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1000.00'),
            platform_fee=Decimal('50.00'),
            gateway_fee=Decimal('29.30'),
            net_amount=Decimal('920.70'),
            payment_gateway=self.stripe_gateway,
            payment_type='milestone',
            status='processing',
            transaction_id='pi_reconcile123'
        )
        
        # Mock gateway service
        with patch.object(StripePaymentService, 'get_payment_status') as mock_status:
            mock_status.return_value = {
                'success': True,
                'status': 'succeeded',
                'amount': Decimal('1000.00'),
                'currency': 'usd'
            }
            
            reconciliation_service = PaymentReconciliationService()
            result = reconciliation_service.reconcile_gateway_transactions('stripe')
            
            self.assertTrue(result['success'])
            self.assertEqual(result['total_payments_checked'], 1)
            self.assertEqual(result['mismatches'], 1)  # Status changed from processing to completed
            
            # Verify payment status was updated
            payment.refresh_from_db()
            self.assertEqual(payment.status, 'completed')
            
            print(f"✓ Reconciliation completed: {result['mismatches']} mismatches found")
    
    def test_webhook_handling(self):
        """Test webhook event handling"""
        print("\n=== Testing Webhook Handling ===")
        
        # Create payment for webhook testing
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1000.00'),
            platform_fee=Decimal('50.00'),
            gateway_fee=Decimal('29.30'),
            net_amount=Decimal('920.70'),
            payment_gateway=self.stripe_gateway,
            payment_type='milestone',
            status='processing',
            transaction_id='pi_webhook123'
        )
        
        # Mock Stripe webhook event
        stripe_event = {
            'type': 'payment_intent.succeeded',
            'data': {
                'object': {
                    'id': 'pi_webhook123',
                    'status': 'succeeded',
                    'amount': 100000,  # $1000.00 in cents
                    'currency': 'usd'
                }
            }
        }
        
        # Test webhook processing
        webhook_service = WebhookService()
        result = webhook_service._handle_stripe_event(stripe_event)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['payment_id'], str(payment.id))
        
        # Verify payment status was updated
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'completed')
        self.assertIsNotNone(payment.processed_at)
        
        print(f"✓ Webhook processed: Payment {payment.id} marked as completed")
    
    def test_batch_payment_processing(self):
        """Test batch payment processing"""
        print("\n=== Testing Batch Payment Processing ===")
        
        # Create multiple payments
        payments = []
        for i in range(3):
            payment = Payment.objects.create(
                milestone=self.milestone,
                developer=self.developer_user,
                amount=Decimal('500.00'),
                platform_fee=Decimal('25.00'),
                gateway_fee=Decimal('14.65'),
                net_amount=Decimal('460.35'),
                payment_gateway=self.stripe_gateway,
                payment_type='milestone',
                status='pending'
            )
            payments.append(payment)
        
        # Mock Stripe API for batch processing
        with patch('stripe.PaymentIntent.create') as mock_create:
            mock_intent = Mock()
            mock_intent.id = 'pi_batch123'
            mock_intent.client_secret = 'pi_batch123_secret'
            mock_intent.status = 'requires_confirmation'
            mock_create.return_value = mock_intent
            
            # Process batch payments
            payment_service = PaymentProcessingService()
            payment_ids = [str(p.id) for p in payments]
            result = payment_service.process_batch_payments(payment_ids)
            
            self.assertTrue(result['success'])
            self.assertEqual(result['total_payments'], 3)
            self.assertEqual(result['successful_payments'], 3)
            self.assertEqual(result['failed_payments'], 0)
            
            print(f"✓ Batch processing completed: {result['successful_payments']}/{result['total_payments']} successful")
    
    def test_payment_dispute_handling(self):
        """Test payment dispute creation and handling"""
        print("\n=== Testing Payment Dispute Handling ===")
        
        # Create payment
        payment = Payment.objects.create(
            milestone=self.milestone,
            developer=self.developer_user,
            amount=Decimal('1000.00'),
            platform_fee=Decimal('50.00'),
            gateway_fee=Decimal('29.30'),
            net_amount=Decimal('920.70'),
            payment_gateway=self.stripe_gateway,
            payment_type='milestone',
            status='completed',
            transaction_id='pi_dispute123'
        )
        
        # Create dispute
        dispute = PaymentDispute.objects.create(
            payment=payment,
            initiated_by=self.client_user,
            disputed_against=self.developer_user,
            dispute_type='quality_issue',
            title='Work Quality Dispute',
            description='Work does not meet requirements',
            disputed_amount=Decimal('500.00'),
            status='opened',
            priority='medium'
        )
        
        self.assertEqual(dispute.status, 'opened')
        self.assertEqual(dispute.disputed_amount, Decimal('500.00'))
        
        print(f"✓ Dispute created: {dispute.title} (${dispute.disputed_amount})")
    
    def test_payment_analytics_and_reporting(self):
        """Test payment analytics and reporting"""
        print("\n=== Testing Payment Analytics and Reporting ===")
        
        # Create completed payments for analytics
        for i in range(5):
            Payment.objects.create(
                milestone=self.milestone,
                developer=self.developer_user,
                amount=Decimal('200.00'),
                platform_fee=Decimal('10.00'),
                gateway_fee=Decimal('5.80'),
                net_amount=Decimal('184.20'),
                payment_gateway=self.stripe_gateway,
                payment_type='milestone',
                status='completed',
                processed_at=timezone.now()
            )
        
        # Generate payment report
        reconciliation_service = PaymentReconciliationService()
        start_date = timezone.now() - timedelta(days=30)
        end_date = timezone.now()
        
        report = reconciliation_service.generate_payment_report(start_date, end_date)
        
        self.assertGreater(report['summary']['total_payments'], 0)
        self.assertGreater(report['summary']['total_amount'], 0)
        self.assertIn('stripe', report['gateway_breakdown'])
        
        print(f"✓ Payment report generated: {report['summary']['total_payments']} payments, ${report['summary']['total_amount']}")
    
    def test_automatic_payment_scheduling(self):
        """Test automatic payment scheduling"""
        print("\n=== Testing Automatic Payment Scheduling ===")
        
        # Mock Celery task
        with patch('payments.tasks.process_milestone_payment_async.delay') as mock_task:
            mock_task.return_value.id = 'task_123'
            
            # Schedule automatic payments
            payment_service = PaymentProcessingService()
            result = payment_service.schedule_automatic_payments(str(self.project.id))
            
            self.assertTrue(result['success'])
            self.assertEqual(result['scheduled_payments'], 1)
            self.assertEqual(len(result['payments']), 1)
            
            scheduled_payment = result['payments'][0]
            self.assertEqual(scheduled_payment['milestone_id'], str(self.milestone.id))
            self.assertEqual(scheduled_payment['milestone_percentage'], 25)
            
            print(f"✓ Automatic payments scheduled: {result['scheduled_payments']} payments")


def run_comprehensive_test():
    """Run comprehensive payment gateway integration test"""
    print("🚀 Starting Comprehensive Payment Gateway Integration Test")
    print("=" * 60)
    
    # Create test suite
    from django.test.utils import setup_test_environment, teardown_test_environment
    from django.test.runner import DiscoverRunner
    
    # Setup test environment
    setup_test_environment()
    
    # Create test runner
    runner = DiscoverRunner(verbosity=2, interactive=False, keepdb=False)
    
    # Setup test database
    old_config = runner.setup_databases()
    
    try:
        # Run the test
        test = PaymentGatewayIntegrationTest()
        test.setUp()
        
        # Run all test methods
        test_methods = [
            'test_stripe_payment_processing',
            'test_paypal_payment_processing',
            'test_milestone_payment_processing',
            'test_payment_delay_handling',
            'test_payment_reconciliation',
            'test_webhook_handling',
            'test_batch_payment_processing',
            'test_payment_dispute_handling',
            'test_payment_analytics_and_reporting',
            'test_automatic_payment_scheduling'
        ]
        
        passed = 0
        failed = 0
        
        for method_name in test_methods:
            try:
                method = getattr(test, method_name)
                method()
                passed += 1
            except Exception as e:
                print(f"❌ {method_name} failed: {str(e)}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"🎯 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("✅ All payment gateway integration tests passed!")
        else:
            print(f"❌ {failed} tests failed")
            
    finally:
        # Cleanup test database
        runner.teardown_databases(old_config)
        teardown_test_environment()


if __name__ == '__main__':
    run_comprehensive_test()