"""
Django settings for freelance_platform project.

Generated by 'django-admin startproject' using Django 5.2.4.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.2/ref/settings/
"""

from pathlib import Path
from decouple import config
import dj_database_url
import os

# Import production configurations
try:
    from .logging_config import LOGGING_CONFIG
    from .database_config import get_database_config, get_read_replica_config, get_cache_config, DatabaseRouter
    from .secrets_manager import secrets_manager
    from .cache_config import CACHE_TIMEOUTS
except ImportError:
    # Fallback for development
    LOGGING_CONFIG = None
    secrets_manager = None
    CACHE_TIMEOUTS = {'short': 300, 'medium': 1800, 'long': 3600, 'very_long': 86400}

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('DJANGO_SECRET_KEY', default='django-insecure-7llk^v7!10(i0#dcvzey%twic_!h9_2kea*wunp!f$7^f%y^1m')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders',
    # Custom apps
    'users',
    'authentication',
    'projects',
    'matching',
    'payments',
    'communications',
    'learning',
    'community',
    'marketplace',
    'ai_services',
    'monitoring',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'freelance_platform.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'freelance_platform.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.parse(
        config('DATABASE_URL', default='sqlite:///db.sqlite3')
    )
}

# Enable pgvector extension for PostgreSQL
if 'postgresql' in DATABASES['default']['ENGINE']:
    # Only add transaction isolation for non-pooled connections
    if 'pooler' not in DATABASES['default'].get('HOST', ''):
        DATABASES['default']['OPTIONS'] = {
            'options': '-c default_transaction_isolation=serializable'
        }


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# JWT Configuration
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=60),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# CORS Configuration for Next.js frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# AI Services Configuration
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

# Embedding and Vector Search Configuration
EMBEDDING_MODEL = config('EMBEDDING_MODEL', default='all-MiniLM-L6-v2')
VECTOR_DIMENSION = config('VECTOR_DIMENSION', default=384, cast=int)
SIMILARITY_THRESHOLD = config('SIMILARITY_THRESHOLD', default=0.7, cast=float)

# GitHub Integration Configuration
GITHUB_CLIENT_ID = config('GITHUB_CLIENT_ID', default='')
GITHUB_CLIENT_SECRET = config('GITHUB_CLIENT_SECRET', default='')
GITHUB_API_BASE_URL = 'https://api.github.com'

# Payment Gateway Configuration
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# PayPal Configuration
PAYPAL_CLIENT_ID = config('PAYPAL_CLIENT_ID', default='')
PAYPAL_CLIENT_SECRET = config('PAYPAL_CLIENT_SECRET', default='')
PAYPAL_WEBHOOK_ID = config('PAYPAL_WEBHOOK_ID', default='')

# Email Configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@freelanceplatform.com')

# Redis Configuration for Caching and Real-time Features
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Celery Configuration
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default=REDIS_URL)
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default=REDIS_URL)
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True

# Celery task routing
CELERY_TASK_ROUTES = {
    'ai_services.tasks.*': {'queue': 'ai_services'},
    'matching.tasks.*': {'queue': 'matching'},
    'communications.tasks.*': {'queue': 'communications'},
    'monitoring.tasks.*': {'queue': 'monitoring'},
    'payments.tasks.*': {'queue': 'payments'},
}

# Celery worker configuration
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Neo4j Configuration for Graph Database
NEO4J_CONFIG = {
    'URI': config('NEO4J_URI', default='bolt://localhost:7687'),
    'USERNAME': config('NEO4J_USERNAME', default='neo4j'),
    'PASSWORD': config('NEO4J_PASSWORD', default='password'),
    'DATABASE': config('NEO4J_DATABASE', default='neo4j'),
    'MAX_CONNECTION_LIFETIME': 3600,
    'MAX_CONNECTION_POOL_SIZE': 50,
    'CONNECTION_ACQUISITION_TIMEOUT': 60,
}

# Vector Database Configuration
VECTOR_DB_CONFIG = {
    'PROVIDER': config('VECTOR_DB_PROVIDER', default='postgresql'),  # postgresql or pinecone
    'PINECONE_API_KEY': config('PINECONE_API_KEY', default=''),
    'PINECONE_ENVIRONMENT': config('PINECONE_ENVIRONMENT', default=''),
    'PINECONE_INDEX_NAME': config('PINECONE_INDEX_NAME', default='freelance-platform'),
}

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Static files configuration
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'ai_services': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'matching': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Platform-specific Configuration
PLATFORM_CONFIG = {
    'MATCHING_ALGORITHM_WEIGHTS': {
        'vector_score': 0.4,
        'graph_score': 0.3,
        'availability_score': 0.2,
        'reputation_score': 0.1,
    },
    'MILESTONE_PERCENTAGES': [25, 50, 75, 100],
    'DEFAULT_TASK_TIMEOUT_HOURS': 72,
    'MAX_TEAM_SIZE': 10,
    'MIN_SENIOR_DEVELOPER_EXPERIENCE_YEARS': 5,
}
# Production Configuration Overrides
if not DEBUG:
    # Use secrets manager for production
    if secrets_manager:
        SECRET_KEY = secrets_manager.get_secret('SECRET_KEY', required=True)
        
        # Database configuration
        try:
            db_config = get_database_config()
            DATABASES['default'] = db_config
            
            # Add read replica if available
            read_replica_config = get_read_replica_config()
            if read_replica_config:
                DATABASES['read_replica'] = read_replica_config
                DATABASE_ROUTERS = ['freelance_platform.database_config.DatabaseRouter']
        except Exception as e:
            print(f"Warning: Could not configure production database: {e}")
        
        # Cache configuration
        try:
            cache_config = get_cache_config()
            CACHES.update(cache_config)
        except Exception as e:
            print(f"Warning: Could not configure production cache: {e}")
    
    # Logging configuration
    if LOGGING_CONFIG:
        LOGGING = LOGGING_CONFIG
    
    # Security settings for production
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = config('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True, cast=bool)
    SECURE_HSTS_PRELOAD = config('SECURE_HSTS_PRELOAD', default=True, cast=bool)
    SECURE_CONTENT_TYPE_NOSNIFF = config('SECURE_CONTENT_TYPE_NOSNIFF', default=True, cast=bool)
    SECURE_BROWSER_XSS_FILTER = config('SECURE_BROWSER_XSS_FILTER', default=True, cast=bool)
    X_FRAME_OPTIONS = config('X_FRAME_OPTIONS', default='DENY')
    SECURE_REFERRER_POLICY = config('SECURE_REFERRER_POLICY', default='strict-origin-when-cross-origin')
    
    # Session security
    SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=True, cast=bool)
    SESSION_COOKIE_HTTPONLY = config('SESSION_COOKIE_HTTPONLY', default=True, cast=bool)
    SESSION_COOKIE_SAMESITE = config('SESSION_COOKIE_SAMESITE', default='Lax')
    CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=True, cast=bool)
    CSRF_COOKIE_HTTPONLY = config('CSRF_COOKIE_HTTPONLY', default=True, cast=bool)
    CSRF_COOKIE_SAMESITE = config('CSRF_COOKIE_SAMESITE', default='Lax')
    
    # CORS for production
    CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='', cast=lambda v: [s.strip() for s in v.split(',') if s.strip()])
    
    # Performance monitoring
    ENABLE_PERFORMANCE_MONITORING = config('ENABLE_PERFORMANCE_MONITORING', default=True, cast=bool)
    
    # Rate limiting
    RATE_LIMIT_ENABLE = config('RATE_LIMIT_ENABLE', default=True, cast=bool)
    
    # File storage (S3 for production)
    USE_S3 = config('USE_S3', default=False, cast=bool)
    if USE_S3:
        AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID', default='')
        AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY', default='')
        AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
        AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
        AWS_S3_CUSTOM_DOMAIN = config('AWS_S3_CUSTOM_DOMAIN', default='')
        AWS_DEFAULT_ACL = None
        AWS_S3_OBJECT_PARAMETERS = {
            'CacheControl': 'max-age=86400',
        }
        DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
        STATICFILES_STORAGE = 'storages.backends.s3boto3.S3StaticStorage'
    
    # Monitoring and alerting
    SENTRY_DSN = config('SENTRY_DSN', default='')
    if SENTRY_DSN:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.celery import CeleryIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(auto_enabling=True),
                CeleryIntegration(auto_enabling=True),
            ],
            traces_sample_rate=0.1,
            send_default_pii=True,
            environment=config('ENVIRONMENT', default='production'),
        )

# Application version
VERSION = config('VERSION', default='1.0.0')

# Feature flags
FEATURE_FLAGS = {
    'ENABLE_AI_MATCHING': config('ENABLE_AI_MATCHING', default=True, cast=bool),
    'ENABLE_PAYMENT_PROCESSING': config('ENABLE_PAYMENT_PROCESSING', default=True, cast=bool),
    'ENABLE_GITHUB_INTEGRATION': config('ENABLE_GITHUB_INTEGRATION', default=True, cast=bool),
    'ENABLE_LEARNING_PLATFORM': config('ENABLE_LEARNING_PLATFORM', default=True, cast=bool),
    'ENABLE_COMMUNITY_FEATURES': config('ENABLE_COMMUNITY_FEATURES', default=True, cast=bool),
}

# Health check configuration
HEALTH_CHECK_CONFIG = {
    'ENABLED': config('HEALTH_CHECK_ENABLED', default=True, cast=bool),
    'CHECK_DATABASE': config('HEALTH_CHECK_DATABASE', default=True, cast=bool),
    'CHECK_CACHE': config('HEALTH_CHECK_CACHE', default=True, cast=bool),
    'CHECK_EXTERNAL_SERVICES': config('HEALTH_CHECK_EXTERNAL_SERVICES', default=True, cast=bool),
}

# Backup configuration
BACKUP_CONFIG = {
    'ENABLED': config('BACKUP_ENABLED', default=True, cast=bool),
    'SCHEDULE': config('BACKUP_SCHEDULE', default='0 2 * * *'),  # Daily at 2 AM
    'RETENTION_DAYS': config('BACKUP_RETENTION_DAYS', default=30, cast=int),
    'S3_BUCKET': config('BACKUP_S3_BUCKET', default=''),
}