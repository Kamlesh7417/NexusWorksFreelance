"""
Secrets management utilities for production deployment
"""
import os
import json
import logging
from typing import Optional, Dict, Any
from django.core.exceptions import ImproperlyConfigured

logger = logging.getLogger(__name__)

class SecretsManager:
    """Manage secrets from various sources"""
    
    def __init__(self):
        self.secrets_cache = {}
        self.secrets_source = os.environ.get('SECRETS_SOURCE', 'env')
    
    def get_secret(self, key: str, default: Optional[str] = None, required: bool = False) -> Optional[str]:
        """Get secret from configured source"""
        
        # Check cache first
        if key in self.secrets_cache:
            return self.secrets_cache[key]
        
        value = None
        
        if self.secrets_source == 'env':
            value = self._get_from_env(key, default)
        elif self.secrets_source == 'aws_secrets_manager':
            value = self._get_from_aws_secrets_manager(key, default)
        elif self.secrets_source == 'azure_key_vault':
            value = self._get_from_azure_key_vault(key, default)
        elif self.secrets_source == 'gcp_secret_manager':
            value = self._get_from_gcp_secret_manager(key, default)
        elif self.secrets_source == 'kubernetes':
            value = self._get_from_kubernetes_secret(key, default)
        else:
            value = self._get_from_env(key, default)
        
        if required and value is None:
            raise ImproperlyConfigured(f"Required secret '{key}' not found")
        
        # Cache the value
        if value is not None:
            self.secrets_cache[key] = value
        
        return value
    
    def _get_from_env(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from environment variables"""
        return os.environ.get(key, default)
    
    def _get_from_aws_secrets_manager(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from AWS Secrets Manager"""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            secret_name = os.environ.get('AWS_SECRET_NAME', 'freelance-platform-secrets')
            region_name = os.environ.get('AWS_REGION', 'us-east-1')
            
            # Create a Secrets Manager client
            session = boto3.session.Session()
            client = session.client(
                service_name='secretsmanager',
                region_name=region_name
            )
            
            try:
                get_secret_value_response = client.get_secret_value(SecretId=secret_name)
                secrets = json.loads(get_secret_value_response['SecretString'])
                return secrets.get(key, default)
            except ClientError as e:
                logger.error(f"Failed to get secret from AWS Secrets Manager: {e}")
                return default
                
        except ImportError:
            logger.warning("boto3 not installed, falling back to environment variables")
            return self._get_from_env(key, default)
    
    def _get_from_azure_key_vault(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from Azure Key Vault"""
        try:
            from azure.keyvault.secrets import SecretClient
            from azure.identity import DefaultAzureCredential
            
            vault_url = os.environ.get('AZURE_KEY_VAULT_URL')
            if not vault_url:
                return self._get_from_env(key, default)
            
            credential = DefaultAzureCredential()
            client = SecretClient(vault_url=vault_url, credential=credential)
            
            try:
                secret = client.get_secret(key)
                return secret.value
            except Exception as e:
                logger.error(f"Failed to get secret from Azure Key Vault: {e}")
                return default
                
        except ImportError:
            logger.warning("Azure SDK not installed, falling back to environment variables")
            return self._get_from_env(key, default)
    
    def _get_from_gcp_secret_manager(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from Google Cloud Secret Manager"""
        try:
            from google.cloud import secretmanager
            
            project_id = os.environ.get('GCP_PROJECT_ID')
            if not project_id:
                return self._get_from_env(key, default)
            
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{project_id}/secrets/{key}/versions/latest"
            
            try:
                response = client.access_secret_version(request={"name": name})
                return response.payload.data.decode("UTF-8")
            except Exception as e:
                logger.error(f"Failed to get secret from GCP Secret Manager: {e}")
                return default
                
        except ImportError:
            logger.warning("Google Cloud SDK not installed, falling back to environment variables")
            return self._get_from_env(key, default)
    
    def _get_from_kubernetes_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from Kubernetes secret mount"""
        secret_path = f"/var/secrets/{key}"
        
        try:
            if os.path.exists(secret_path):
                with open(secret_path, 'r') as f:
                    return f.read().strip()
            else:
                return self._get_from_env(key, default)
        except Exception as e:
            logger.error(f"Failed to read Kubernetes secret: {e}")
            return default
    
    def get_database_config(self) -> Dict[str, Any]:
        """Get database configuration from secrets"""
        return {
            'url': self.get_secret('DATABASE_URL', required=True),
            'read_replica_url': self.get_secret('READ_REPLICA_URL'),
            'conn_max_age': int(self.get_secret('DB_CONN_MAX_AGE', '300')),
            'max_conns': int(self.get_secret('DB_MAX_CONNS', '20')),
            'min_conns': int(self.get_secret('DB_MIN_CONNS', '5')),
        }
    
    def get_redis_config(self) -> Dict[str, Any]:
        """Get Redis configuration from secrets"""
        return {
            'url': self.get_secret('REDIS_URL', required=True),
            'max_connections': int(self.get_secret('REDIS_MAX_CONNECTIONS', '50')),
        }
    
    def get_ai_service_config(self) -> Dict[str, Any]:
        """Get AI service configuration from secrets"""
        return {
            'gemini_api_key': self.get_secret('GEMINI_API_KEY', required=True),
            'openai_api_key': self.get_secret('OPENAI_API_KEY'),
            'github_token': self.get_secret('GITHUB_TOKEN', required=True),
        }
    
    def get_payment_config(self) -> Dict[str, Any]:
        """Get payment service configuration from secrets"""
        return {
            'stripe': {
                'publishable_key': self.get_secret('STRIPE_PUBLISHABLE_KEY'),
                'secret_key': self.get_secret('STRIPE_SECRET_KEY'),
                'webhook_secret': self.get_secret('STRIPE_WEBHOOK_SECRET'),
            },
            'paypal': {
                'client_id': self.get_secret('PAYPAL_CLIENT_ID'),
                'client_secret': self.get_secret('PAYPAL_CLIENT_SECRET'),
                'mode': self.get_secret('PAYPAL_MODE', 'sandbox'),
            }
        }
    
    def get_email_config(self) -> Dict[str, Any]:
        """Get email configuration from secrets"""
        return {
            'host': self.get_secret('EMAIL_HOST', required=True),
            'port': int(self.get_secret('EMAIL_PORT', '587')),
            'use_tls': self.get_secret('EMAIL_USE_TLS', 'True').lower() == 'true',
            'user': self.get_secret('EMAIL_HOST_USER', required=True),
            'password': self.get_secret('EMAIL_HOST_PASSWORD', required=True),
            'from_email': self.get_secret('DEFAULT_FROM_EMAIL', required=True),
        }
    
    def get_storage_config(self) -> Dict[str, Any]:
        """Get file storage configuration from secrets"""
        return {
            'aws': {
                'access_key_id': self.get_secret('AWS_ACCESS_KEY_ID'),
                'secret_access_key': self.get_secret('AWS_SECRET_ACCESS_KEY'),
                'bucket_name': self.get_secret('AWS_STORAGE_BUCKET_NAME'),
                'region': self.get_secret('AWS_S3_REGION_NAME', 'us-east-1'),
                'custom_domain': self.get_secret('AWS_S3_CUSTOM_DOMAIN'),
            },
            'use_s3': self.get_secret('USE_S3', 'False').lower() == 'true',
        }

# Global secrets manager instance
secrets_manager = SecretsManager()

def get_secret(key: str, default: Optional[str] = None, required: bool = False) -> Optional[str]:
    """Convenience function to get secrets"""
    return secrets_manager.get_secret(key, default, required)