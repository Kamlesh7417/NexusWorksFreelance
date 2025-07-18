"""
Production settings for freelance_platform project
"""
import os
import sys
from .settings import *
from .secrets_manager import secrets_manager
from .logging_config import get_logging_config
from .database_config import get_database_config, get_read_replica_config, get_cache_config
from .cache_config import CACHE_TIMEOUTS

# Override base settings for production
DEBUG = False
ENVIRONMENT = 'production'

# Security settings
SECRET_KEY = secrets_manager.get_secret('SECRET_KEY', required=True)

# Allowed hosts
ALLOWED_HOSTS = [
    host.strip() 
    for host in secrets_manager.get_secret('ALLOWED_HOSTS', '').split(',') 
    if host.strip()
]

# Database configuration
DATABASES = {
    'default': get_database_config(),
}

# Add read replica if configured
read_replica_config = get_read_replica_config()
if read_replica_config:
    DATABASES['read_replica'] = read_replica_config
    DATABASE_ROUTERS = ['freelance_platform.database_config.DatabaseRouter']

# Cache configuration
CACHES = get_cache_config()

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = int(secrets_manager.get_secret('SESSION_TIMEOUT', '86400'))

# CSRF configuration
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = [
    f"https://{host}" for host in ALLOWED_HOSTS if not host.startswith('.')
]

# Security middleware and settings
SECURE_SSL_REDIRECT = secrets_manager.get_secret('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SECURE_HSTS_SECONDS = int(secrets_manager.get_secret('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = secrets_manager.get_secret('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True').lower() == 'true'
SECURE_HSTS_PRELOAD = secrets_manager.get_secret('SECURE_HSTS_PRELOAD', 'True').lower() == 'true'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# CORS configuration
CORS_ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in secrets_manager.get_secret('CORS_ALLOWED_ORIGINS', '').split(',') 
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = secrets_manager.get_secret('CORS_ALLOW_CREDENTIALS', 'True').lower() == 'true'
CORS_ALLOW_ALL_ORIGINS = False

# Add security middleware
MIDDLEWARE.insert(1, 'django.middleware.security.SecurityMiddleware')
MIDDLEWARE.append('freelance_platform.cache_config.DistributedRateLimitMiddleware')
MIDDLEWARE.append('freelance_platform.logging_config.RequestLoggingMiddleware')

# Logging configuration
LOGGING = get_logging_config()

# Email configuration
email_config = secrets_manager.get_email_config()
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = email_config['host']
EMAIL_PORT = email_config['port']
EMAIL_USE_TLS = email_config['use_tls']
EMAIL_HOST_USER = email_config['user']
EMAIL_HOST_PASSWORD = email_config['password']
DEFAULT_FROM_EMAIL = email_config['from_email']
SERVER_EMAIL = email_config['from_email']

# File storage configuration
storage_config = secrets_manager.get_storage_config()
if storage_config['use_s3']:
    # AWS S3 configuration
    AWS_ACCESS_KEY_ID = storage_config['aws']['access_key_id']
    AWS_SECRET_ACCESS_KEY = storage_config['aws']['secret_access_key']
    AWS_STORAGE_BUCKET_NAME = storage_config['aws']['bucket_name']
    AWS_S3_REGION_NAME = storage_config['aws']['region']
    AWS_S3_CUSTOM_DOMAIN = storage_config['aws']['custom_domain']
    AWS_DEFAULT_ACL = 'public-read'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    AWS_LOCATION = 'static'
    AWS_MEDIA_LOCATION = 'media'
    
    # Static files
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/'
    
    # Media files
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_MEDIA_LOCATION}/'
else:
    # Local file storage
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# AI Services configuration
ai_config = secrets_manager.get_ai_service_config()
GEMINI_API_KEY = ai_config['gemini_api_key']
OPENAI_API_KEY = ai_config.get('openai_api_key')
GITHUB_TOKEN = ai_config['github_token']

# Payment configuration
payment_config = secrets_manager.get_payment_config()
STRIPE_PUBLISHABLE_KEY = payment_config['stripe']['publishable_key']
STRIPE_SECRET_KEY = payment_config['stripe']['secret_key']
STRIPE_WEBHOOK_SECRET = payment_config['stripe']['webhook_secret']
PAYPAL_CLIENT_ID = payment_config['paypal']['client_id']
PAYPAL_CLIENT_SECRET = payment_config['paypal']['client_secret']
PAYPAL_MODE = payment_config['paypal']['mode']

# Celery configuration
CELERY_BROKER_URL = secrets_manager.get_secret('CELERY_BROKER_URL', required=True)
CELERY_RESULT_BACKEND = secrets_manager.get_secret('CELERY_RESULT_BACKEND', required=True)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_WORKER_CONCURRENCY = int(secrets_manager.get_secret('CELERY_WORKER_CONCURRENCY', '4'))
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000
CELERY_WORKER_DISABLE_RATE_LIMITS = False
CELERY_TASK_SOFT_TIME_LIMIT = 300  # 5 minutes
CELERY_TASK_TIME_LIMIT = 600  # 10 minutes
CELERY_TASK_ALWAYS_EAGER = False
CELERY_TASK_EAGER_PROPAGATES = False
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_SEND_TASK_EVENTS = True
CELERY_TASK_SEND_SENT_EVENT = True

# Celery beat configuration
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'

# Performance monitoring
ENABLE_PERFORMANCE_MONITORING = secrets_manager.get_secret('ENABLE_PERFORMANCE_MONITORING', 'True').lower() == 'true'

# Sentry configuration for error tracking
SENTRY_DSN = secrets_manager.get_secret('SENTRY_DSN')
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=True,
            ),
            CeleryIntegration(
                monitor_beat_tasks=True,
                propagate_traces=True,
            ),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of transactions
        send_default_pii=False,
        environment=ENVIRONMENT,
        release=secrets_manager.get_secret('VERSION', '1.0.0'),
        before_send=lambda event, hint: event if not DEBUG else None,
    )

# Rate limiting configuration
RATE_LIMIT_ENABLE = secrets_manager.get_secret('RATE_LIMIT_ENABLE', 'True').lower() == 'true'
RATE_LIMIT_PER_IP = int(secrets_manager.get_secret('RATE_LIMIT_PER_IP', '100'))
RATE_LIMIT_WINDOW = int(secrets_manager.get_secret('RATE_LIMIT_WINDOW', '3600'))

# Feature flags
ENABLE_AI_MATCHING = secrets_manager.get_secret('ENABLE_AI_MATCHING', 'True').lower() == 'true'
ENABLE_PAYMENT_PROCESSING = secrets_manager.get_secret('ENABLE_PAYMENT_PROCESSING', 'True').lower() == 'true'
ENABLE_GITHUB_INTEGRATION = secrets_manager.get_secret('ENABLE_GITHUB_INTEGRATION', 'True').lower() == 'true'
ENABLE_LEARNING_PLATFORM = secrets_manager.get_secret('ENABLE_LEARNING_PLATFORM', 'True').lower() == 'true'
ENABLE_COMMUNITY_FEATURES = secrets_manager.get_secret('ENABLE_COMMUNITY_FEATURES', 'True').lower() == 'true'

# Backup configuration
BACKUP_ENABLED = secrets_manager.get_secret('BACKUP_ENABLED', 'True').lower() == 'true'
BACKUP_RETENTION_DAYS = int(secrets_manager.get_secret('BACKUP_RETENTION_DAYS', '30'))
BACKUP_S3_BUCKET = secrets_manager.get_secret('BACKUP_S3_BUCKET')

# Health check configuration
HEALTH_CHECK_ENABLED = secrets_manager.get_secret('HEALTH_CHECK_ENABLED', 'True').lower() == 'true'
HEALTH_CHECK_DATABASE = secrets_manager.get_secret('HEALTH_CHECK_DATABASE', 'True').lower() == 'true'
HEALTH_CHECK_CACHE = secrets_manager.get_secret('HEALTH_CHECK_CACHE', 'True').lower() == 'true'
HEALTH_CHECK_EXTERNAL_SERVICES = secrets_manager.get_secret('HEALTH_CHECK_EXTERNAL_SERVICES', 'True').lower() == 'true'

# Monitoring and alerting
SLACK_WEBHOOK_URL = secrets_manager.get_secret('SLACK_WEBHOOK_URL')
SLACK_ALERT_CHANNEL = secrets_manager.get_secret('SLACK_ALERT_CHANNEL', '#alerts')
DISCORD_WEBHOOK_URL = secrets_manager.get_secret('DISCORD_WEBHOOK_URL')
PAGERDUTY_INTEGRATION_KEY = secrets_manager.get_secret('PAGERDUTY_INTEGRATION_KEY')
ALERT_EMAIL_RECIPIENTS = [
    email.strip() 
    for email in secrets_manager.get_secret('ALERT_EMAIL_RECIPIENTS', '').split(',') 
    if email.strip()
]

# Application version
VERSION = secrets_manager.get_secret('VERSION', '1.0.0')

# Django REST Framework configuration for production
REST_FRAMEWORK.update({
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'freelance_platform.exceptions.custom_exception_handler',
})

# Custom exception handler
def custom_exception_handler(exc, context):
    """Custom exception handler for production"""
    from rest_framework.views import exception_handler
    from rest_framework.response import Response
    import logging
    
    logger = logging.getLogger('django.request')
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the exception
        logger.error(f"API Exception: {exc}", exc_info=True, extra={
            'request': context.get('request'),
            'view': context.get('view'),
        })
        
        # Customize error response
        custom_response_data = {
            'error': {
                'message': 'An error occurred while processing your request.',
                'code': response.status_code,
                'timestamp': timezone.now().isoformat(),
            }
        }
        
        # Add details for non-production or specific error types
        if hasattr(exc, 'detail'):
            custom_response_data['error']['details'] = response.data
        
        response.data = custom_response_data
    
    return response

# Admin configuration
ADMIN_URL = secrets_manager.get_secret('ADMIN_URL', 'admin/')
if not ADMIN_URL.endswith('/'):
    ADMIN_URL += '/'

# Disable browsable API in production
if 'rest_framework.renderers.BrowsableAPIRenderer' in REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES']:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].remove('rest_framework.renderers.BrowsableAPIRenderer')

# Optimize database queries
if 'debug_toolbar' in INSTALLED_APPS:
    INSTALLED_APPS.remove('debug_toolbar')

if 'debug_toolbar.middleware.DebugToolbarMiddleware' in MIDDLEWARE:
    MIDDLEWARE.remove('debug_toolbar.middleware.DebugToolbarMiddleware')

# Production-specific apps
INSTALLED_APPS += [
    'storages',  # For S3 storage
    'django_celery_beat',  # For periodic tasks
    'django_celery_results',  # For task results
]

# Disable Django's own staticfiles handling in production
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Add WhiteNoise middleware for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Compress static files
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# Template optimization
for template_engine in TEMPLATES:
    if template_engine['BACKEND'] == 'django.template.backends.django.DjangoTemplates':
        template_engine['OPTIONS']['loaders'] = [
            ('django.template.loaders.cached.Loader', [
                'django.template.loaders.filesystem.Loader',
                'django.template.loaders.app_directories.Loader',
            ]),
        ]

# Password validation - enhanced for production
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {
            'user_attributes': ('username', 'email', 'first_name', 'last_name'),
            'max_similarity': 0.7,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Data upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# Timeout settings
CONN_MAX_AGE = 300  # 5 minutes

# Internationalization
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom settings validation
def validate_production_settings():
    """Validate critical production settings"""
    required_settings = [
        'SECRET_KEY',
        'ALLOWED_HOSTS',
        'DATABASES',
        'EMAIL_HOST',
        'GEMINI_API_KEY',
        'GITHUB_TOKEN',
    ]
    
    missing_settings = []
    for setting in required_settings:
        if not globals().get(setting):
            missing_settings.append(setting)
    
    if missing_settings:
        raise ImproperlyConfigured(
            f"Missing required production settings: {', '.join(missing_settings)}"
        )
    
    # Validate security settings
    if DEBUG:
        raise ImproperlyConfigured("DEBUG must be False in production")
    
    if not SECURE_SSL_REDIRECT:
        print("WARNING: SECURE_SSL_REDIRECT is disabled")
    
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured("ALLOWED_HOSTS must be configured")

# Run validation
validate_production_settings()