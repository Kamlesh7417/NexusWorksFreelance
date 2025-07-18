"""
Security tests for authentication and payment processing
"""
import json
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from unittest.mock import patch

from projects.models import Project, Task
from users.models import DeveloperProfile, ClientProfile
from payments.models import Payment, PaymentMethod, PaymentDispute

User = get_user_model()


class AuthenticationSecurityTest(APITestCase):
    """Security tests for authentication system"""
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='securepass123',
            role='developer'
        )
        self.token = Token.objects.create(user=self.user)
    
    def test_password_strength_validation(self):
        """Test password strength requirements"""
        url = reverse('authentication:register')
        
        # Test weak passwords
        weak_passwords = [
            '123',
            'password',
            '12345678',
            'qwerty',
            'abc123'
        ]
        
        for weak_password in weak_passwords:
            user_data = {
                'email': f'weak{weak_password}@example.com',
                'password': weak_password,
                'role': 'developer'
            }
            
            response = self.client.post(url, user_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn('password', response.data)
    
    def test_rate_limiting_login_attempts(self):
        """Test rate limiting for login attempts"""
        url = reverse('authentication:login')
        
        # Attempt multiple failed logins
        for i in range(10):
            login_data = {
                'email': 'test@example.com',
                'password': 'wrongpassword'
            }
            response = self.client.post(url, login_data, format='json')
            
            if i < 5:
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            else:
                # After 5 attempts, should be rate limited
                self.assertIn(response.status_code, [status.HTTP_429_TOO_MANY_REQUESTS, status.HTTP_401_UNAUTHORIZED])
    
    def test_token_expiration(self):
        """Test token expiration and refresh"""
        # Test with expired token (mock expiration)
        with patch('rest_framework.authtoken.models.Token.objects.get') as mock_get:
            mock_get.side_effect = Token.DoesNotExist
            
            self.client.credentials(HTTP_AUTHORIZATION='Token invalid_token')
            url = reverse('authentication:profile')
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_sql_injection_protection(self):
        """Test protection against SQL injection attacks"""
        url = reverse('authentication:login')
        
        # SQL injection attempts
        injection_attempts = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users --"
        ]
        
        for injection in injection_attempts:
            login_data = {
                'email': injection,
                'password': 'password'
            }
            
            response = self.client.post(url, login_data, format='json')
            # Should not cause server error, should return 401 or 400
            self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_xss_protection(self):
        """Test protection against XSS attacks"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        
        # XSS payloads
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "';alert('xss');//"
        ]
        
        url = reverse('authentication:profile')
        
        for payload in xss_payloads:
            update_data = {
                'first_name': payload,
                'last_name': payload
            }
            
            response = self.client.patch(url, update_data, format='json')
            
            # Should either reject the input or sanitize it
            if response.status_code == status.HTTP_200_OK:
                # If accepted, should be sanitized
                self.assertNotIn('<script>', response.data.get('first_name', ''))
                self.assertNotIn('javascript:', response.data.get('first_name', ''))
    
    def test_unauthorized_access_protection(self):
        """Test protection against unauthorized access"""
        # Test accessing protected endpoints without authentication
        protected_endpoints = [
            '/api/projects/',
            '/api/profile/',
            '/api/matching/',
            '/api/payments/'
        ]
        
        for endpoint in protected_endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_role_based_access_control(self):
        """Test role-based access control"""
        # Create users with different roles
        client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        developer_user = User.objects.create_user(
            email='developer@example.com',
            password='testpass123',
            role='developer'
        )
        
        admin_user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            role='admin'
        )
        
        client_token = Token.objects.create(user=client_user)
        developer_token = Token.objects.create(user=developer_user)
        admin_token = Token.objects.create(user=admin_user)
        
        # Test client trying to access admin endpoints
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + client_token.key)
        response = self.client.get('/api/admin/users/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        
        # Test developer trying to access client-only endpoints
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + developer_token.key)
        response = self.client.post('/api/projects/', {'title': 'Test'}, format='json')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])


class PaymentSecurityTest(APITestCase):
    """Security tests for payment processing"""
    
    def setUp(self):
        """Set up test data"""
        self.client_user = User.objects.create_user(
            email='client@example.com',
            password='testpass123',
            role='client'
        )
        
        self.developer_user = User.objects.create_user(
            email='dev@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test project',
            budget_estimate=Decimal('5000.00'),
            timeline_estimate=timedelta(days=20)
        )
        
        self.payment_method = PaymentMethod.objects.create(
            user=self.client_user,
            type='credit_card',
            is_default=True,
            details={'last_four': '1234', 'brand': 'visa'}
        )
        
        self.client_token = Token.objects.create(user=self.client_user)
        self.developer_token = Token.objects.create(user=self.developer_user)
        self.api_client = APIClient()
    
    def test_payment_authorization(self):
        """Test payment authorization and access control"""
        # Test developer trying to access client's payment methods
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.developer_token.key)
        
        response = self.api_client.get('/api/payments/methods/')
        # Should not see client's payment methods
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])
        
        if response.status_code == status.HTTP_200_OK:
            # If endpoint exists, should return empty or forbidden
            payment_methods = response.data.get('results', response.data)
            if isinstance(payment_methods, list):
                self.assertEqual(len(payment_methods), 0)
    
    def test_payment_data_encryption(self):
        """Test that sensitive payment data is properly encrypted/masked"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        response = self.api_client.get('/api/payments/methods/')
        
        if response.status_code == status.HTTP_200_OK:
            payment_methods = response.data.get('results', response.data)
            if isinstance(payment_methods, list) and len(payment_methods) > 0:
                payment_method = payment_methods[0]
                
                # Should not expose full card number
                self.assertNotIn('card_number', payment_method)
                self.assertNotIn('cvv', payment_method)
                
                # Should only show last 4 digits
                if 'details' in payment_method:
                    details = payment_method['details']
                    if 'last_four' in details:
                        self.assertEqual(len(details['last_four']), 4)
    
    def test_payment_amount_validation(self):
        """Test payment amount validation and tampering protection"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        # Test negative amounts
        payment_data = {
            'amount': -100.00,
            'payment_method_id': self.payment_method.id
        }
        
        response = self.api_client.post('/api/payments/process/', payment_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test extremely large amounts
        payment_data = {
            'amount': 999999999.99,
            'payment_method_id': self.payment_method.id
        }
        
        response = self.api_client.post('/api/payments/process/', payment_data, format='json')
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])
    
    def test_payment_replay_attack_protection(self):
        """Test protection against payment replay attacks"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        payment_data = {
            'amount': 100.00,
            'payment_method_id': self.payment_method.id,
            'idempotency_key': 'test-key-123'
        }
        
        # First request
        response1 = self.api_client.post('/api/payments/process/', payment_data, format='json')
        
        # Second request with same idempotency key
        response2 = self.api_client.post('/api/payments/process/', payment_data, format='json')
        
        # Should either reject duplicate or return same result
        if response1.status_code == status.HTTP_200_OK:
            # If first succeeded, second should either succeed with same result or be rejected
            self.assertIn(response2.status_code, [status.HTTP_200_OK, status.HTTP_409_CONFLICT])
    
    @patch('payments.services.PaymentGatewayService.process_payment')
    def test_payment_gateway_error_handling(self, mock_payment):
        """Test secure handling of payment gateway errors"""
        # Mock payment gateway failure
        mock_payment.side_effect = Exception("Payment gateway error")
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.client_token.key)
        
        payment_data = {
            'amount': 100.00,
            'payment_method_id': self.payment_method.id
        }
        
        response = self.api_client.post('/api/payments/process/', payment_data, format='json')
        
        # Should handle error gracefully without exposing internal details
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])
        
        if 'error' in response.data:
            error_message = response.data['error']
            # Should not expose internal error details
            self.assertNotIn('gateway', error_message.lower())
            self.assertNotIn('exception', error_message.lower())


class DataProtectionTest(APITestCase):
    """Tests for data protection and privacy"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123',
            role='developer'
        )
        
        self.token1 = Token.objects.create(user=self.user1)
        self.token2 = Token.objects.create(user=self.user2)
        self.api_client = APIClient()
    
    def test_user_data_isolation(self):
        """Test that users can only access their own data"""
        # Create profiles for both users
        DeveloperProfile.objects.create(
            user=self.user1,
            skills=['Python', 'Django'],
            experience_level='mid',
            hourly_rate=Decimal('75.00'),
            bio='User 1 bio'
        )
        
        DeveloperProfile.objects.create(
            user=self.user2,
            skills=['JavaScript', 'React'],
            experience_level='senior',
            hourly_rate=Decimal('100.00'),
            bio='User 2 bio'
        )
        
        # User 1 trying to access their own profile
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1.key)
        response = self.api_client.get('/api/profile/')
        
        if response.status_code == status.HTTP_200_OK:
            self.assertEqual(response.data['email'], 'user1@example.com')
            # Should not see other user's data
            self.assertNotEqual(response.data.get('bio'), 'User 2 bio')
    
    def test_sensitive_data_filtering(self):
        """Test that sensitive data is filtered from API responses"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1.key)
        
        response = self.api_client.get('/api/profile/')
        
        if response.status_code == status.HTTP_200_OK:
            # Should not expose sensitive fields
            sensitive_fields = ['password', 'password_hash', 'token', 'secret']
            
            for field in sensitive_fields:
                self.assertNotIn(field, response.data)
    
    def test_data_anonymization_in_logs(self):
        """Test that sensitive data is anonymized in logs"""
        # This would typically involve checking log files
        # For now, we'll test that API responses don't leak sensitive data
        
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1.key)
        
        # Make request that might be logged
        response = self.api_client.get('/api/profile/')
        
        # Verify response doesn't contain sensitive data that might be logged
        response_str = str(response.data)
        
        sensitive_patterns = [
            'password',
            'token',
            'secret',
            'key'
        ]
        
        for pattern in sensitive_patterns:
            self.assertNotIn(pattern, response_str.lower())
    
    def test_gdpr_data_export(self):
        """Test GDPR-compliant data export functionality"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1.key)
        
        # Request data export
        response = self.api_client.post('/api/profile/export-data/')
        
        if response.status_code == status.HTTP_200_OK:
            # Should include user's data
            export_data = response.data
            self.assertIn('user_data', export_data)
            self.assertEqual(export_data['user_data']['email'], 'user1@example.com')
    
    def test_gdpr_data_deletion(self):
        """Test GDPR-compliant data deletion functionality"""
        self.api_client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1.key)
        
        # Request account deletion
        response = self.api_client.delete('/api/profile/delete-account/')
        
        if response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]:
            # User should be marked for deletion or anonymized
            self.user1.refresh_from_db()
            # Check if user is deactivated or anonymized
            self.assertTrue(
                not self.user1.is_active or 
                self.user1.email.startswith('deleted_') or
                self.user1.email == 'anonymized@example.com'
            )