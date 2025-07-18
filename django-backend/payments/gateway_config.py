"""
Payment gateway configuration and settings
"""
import os
from django.conf import settings
from typing import Dict, Any


class PaymentGatewayConfig:
    """Configuration manager for payment gateways"""
    
    @staticmethod
    def get_stripe_config() -> Dict[str, Any]:
        """Get Stripe configuration"""
        return {
            'secret_key': os.getenv('STRIPE_SECRET_KEY', ''),
            'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
            'webhook_secret': os.getenv('STRIPE_WEBHOOK_SECRET', ''),
            'api_version': '2023-10-16',
            'currency': 'usd',
            'fee_percentage': 0.029,  # 2.9%
            'fee_fixed': 0.30,  # $0.30
            'supported_countries': ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL'],
            'supported_currencies': ['usd', 'eur', 'gbp', 'cad', 'aud'],
            'features': {
                'refunds': True,
                'partial_refunds': True,
                'recurring': True,
                'escrow': False,
                'disputes': True
            }
        }
    
    @staticmethod
    def get_paypal_config() -> Dict[str, Any]:
        """Get PayPal configuration"""
        return {
            'client_id': os.getenv('PAYPAL_CLIENT_ID', ''),
            'client_secret': os.getenv('PAYPAL_CLIENT_SECRET', ''),
            'mode': 'sandbox' if settings.DEBUG else 'live',
            'webhook_id': os.getenv('PAYPAL_WEBHOOK_ID', ''),
            'currency': 'USD',
            'fee_percentage': 0.025,  # 2.5%
            'fee_fixed': 0.00,
            'supported_countries': ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES'],
            'supported_currencies': ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
            'features': {
                'refunds': False,  # Payouts cannot be refunded directly
                'partial_refunds': False,
                'recurring': False,
                'escrow': False,
                'disputes': True
            }
        }
    
    @staticmethod
    def get_platform_config() -> Dict[str, Any]:
        """Get platform-specific payment configuration"""
        return {
            'platform_fee_percentage': 0.05,  # 5% platform fee
            'minimum_payout': 10.00,  # Minimum $10 payout
            'maximum_payout': 10000.00,  # Maximum $10,000 payout
            'payment_delay_thresholds': {
                'warning': 3,  # Send warning after 3 days
                'pause': 7,    # Pause project after 7 days
                'escalate': 14  # Escalate to admin after 14 days
            },
            'supported_payment_methods': [
                'stripe_account',
                'paypal',
                'bank_account',
                'crypto_wallet'
            ],
            'default_currency': 'USD',
            'tax_handling': {
                'collect_tax_info': True,
                'issue_1099': True,
                'threshold_1099': 600.00
            }
        }
    
    @staticmethod
    def validate_gateway_config(gateway_type: str) -> Dict[str, Any]:
        """Validate gateway configuration"""
        if gateway_type == 'stripe':
            config = PaymentGatewayConfig.get_stripe_config()
            required_fields = ['secret_key', 'publishable_key', 'webhook_secret']
        elif gateway_type == 'paypal':
            config = PaymentGatewayConfig.get_paypal_config()
            required_fields = ['client_id', 'client_secret']
        else:
            return {
                'valid': False,
                'error': f'Unsupported gateway type: {gateway_type}'
            }
        
        missing_fields = [field for field in required_fields if not config.get(field)]
        
        if missing_fields:
            return {
                'valid': False,
                'error': f'Missing required configuration fields: {", ".join(missing_fields)}'
            }
        
        return {
            'valid': True,
            'config': config
        }
    
    @staticmethod
    def get_webhook_endpoints() -> Dict[str, str]:
        """Get webhook endpoint URLs"""
        base_url = os.getenv('WEBHOOK_BASE_URL', 'https://your-domain.com')
        
        return {
            'stripe': f'{base_url}/api/payments/webhooks/stripe/',
            'paypal': f'{base_url}/api/payments/webhooks/paypal/',
        }
    
    @staticmethod
    def get_gateway_limits(gateway_type: str) -> Dict[str, Any]:
        """Get gateway-specific limits and restrictions"""
        if gateway_type == 'stripe':
            return {
                'min_amount': 0.50,  # $0.50 minimum
                'max_amount': 999999.99,  # $999,999.99 maximum
                'daily_limit': 100000.00,  # $100,000 daily limit
                'monthly_limit': 1000000.00,  # $1,000,000 monthly limit
                'rate_limit': {
                    'requests_per_second': 100,
                    'burst_limit': 1000
                }
            }
        elif gateway_type == 'paypal':
            return {
                'min_amount': 1.00,  # $1.00 minimum
                'max_amount': 20000.00,  # $20,000 maximum per transaction
                'daily_limit': 60000.00,  # $60,000 daily limit
                'monthly_limit': 500000.00,  # $500,000 monthly limit
                'rate_limit': {
                    'requests_per_second': 10,
                    'burst_limit': 50
                }
            }
        else:
            return {}


class PaymentSecurityConfig:
    """Security configuration for payment processing"""
    
    @staticmethod
    def get_encryption_config() -> Dict[str, Any]:
        """Get encryption configuration for sensitive data"""
        return {
            'algorithm': 'AES-256-GCM',
            'key_rotation_days': 90,
            'encrypt_fields': [
                'account_details',
                'api_key_encrypted',
                'webhook_secret'
            ]
        }
    
    @staticmethod
    def get_audit_config() -> Dict[str, Any]:
        """Get audit configuration for payment transactions"""
        return {
            'log_all_transactions': True,
            'log_sensitive_data': False,
            'retention_days': 2555,  # 7 years for financial records
            'audit_levels': ['info', 'warning', 'error', 'critical'],
            'required_fields': [
                'user_id',
                'transaction_id',
                'amount',
                'gateway_type',
                'timestamp',
                'ip_address',
                'user_agent'
            ]
        }
    
    @staticmethod
    def get_fraud_detection_config() -> Dict[str, Any]:
        """Get fraud detection configuration"""
        return {
            'enabled': True,
            'velocity_checks': {
                'max_transactions_per_hour': 10,
                'max_amount_per_hour': 5000.00,
                'max_transactions_per_day': 50,
                'max_amount_per_day': 25000.00
            },
            'risk_factors': {
                'new_payment_method': 0.3,
                'high_amount': 0.4,
                'unusual_location': 0.5,
                'multiple_failures': 0.6
            },
            'threshold_block': 0.8,
            'threshold_review': 0.6
        }


class PaymentNotificationConfig:
    """Configuration for payment notifications"""
    
    @staticmethod
    def get_notification_templates() -> Dict[str, Dict[str, str]]:
        """Get notification templates for different payment events"""
        return {
            'payment_success': {
                'subject': 'Payment Received - ${amount}',
                'template': 'payments/notifications/payment_success.html',
                'recipients': ['developer', 'client']
            },
            'payment_failed': {
                'subject': 'Payment Failed - ${amount}',
                'template': 'payments/notifications/payment_failed.html',
                'recipients': ['developer', 'admin']
            },
            'payment_overdue': {
                'subject': 'Payment Overdue - ${amount}',
                'template': 'payments/notifications/payment_overdue.html',
                'recipients': ['client', 'admin']
            },
            'project_paused': {
                'subject': 'Project Paused - Payment Required',
                'template': 'payments/notifications/project_paused.html',
                'recipients': ['client', 'team_members']
            },
            'dispute_created': {
                'subject': 'Payment Dispute Created - ${amount}',
                'template': 'payments/notifications/dispute_created.html',
                'recipients': ['client', 'developer', 'admin']
            }
        }
    
    @staticmethod
    def get_notification_channels() -> Dict[str, bool]:
        """Get enabled notification channels"""
        return {
            'email': True,
            'sms': False,
            'push': True,
            'in_app': True,
            'webhook': True
        }


# Export configuration classes
__all__ = [
    'PaymentGatewayConfig',
    'PaymentSecurityConfig', 
    'PaymentNotificationConfig'
]