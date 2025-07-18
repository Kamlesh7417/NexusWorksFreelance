"""
Enhanced logging configuration for production deployment
"""
import os
import sys
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

def get_logging_config():
    """Get logging configuration based on environment"""
    
    # Ensure logs directory exists
    logs_dir = BASE_DIR / 'logs'
    logs_dir.mkdir(exist_ok=True)
    
    # Get log level from environment
    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    
    # Check if we're in production
    is_production = os.environ.get('ENVIRONMENT', 'development') == 'production'
    
    # Sentry DSN for error tracking
    sentry_dsn = os.environ.get('SENTRY_DSN')
    
    config = {
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
            'json': {
                'format': '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(module)s", "process": %(process)d, "thread": %(thread)d, "message": "%(message)s", "pathname": "%(pathname)s", "lineno": %(lineno)d}',
            },
            'structured': {
                'format': '[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S',
            },
            'access': {
                'format': '%(asctime)s [%(process)d] [%(levelname)s] "%(message)s"',
                'datefmt': '%Y-%m-%d %H:%M:%S',
            },
        },
        'filters': {
            'require_debug_true': {
                '()': 'django.utils.log.RequireDebugTrue',
            },
            'require_debug_false': {
                '()': 'django.utils.log.RequireDebugFalse',
            },
            'skip_unreadable_posts': {
                '()': 'django.utils.log.CallbackFilter',
                'callback': lambda record: 'Invalid HTTP_HOST header' not in record.getMessage(),
            },
        },
        'handlers': {
            'console': {
                'level': log_level,
                'class': 'logging.StreamHandler',
                'formatter': 'structured' if is_production else 'simple',
                'stream': sys.stdout,
            },
            'file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'django.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'json' if is_production else 'verbose',
                'filters': ['skip_unreadable_posts'],
            },
            'error_file': {
                'level': 'ERROR',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'django_errors.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'json',
            },
            'security_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'security.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'json',
            },
            'performance_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'performance.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'json',
            },
            'access_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'access.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'access',
            },
            'celery_file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': logs_dir / 'celery.log',
                'maxBytes': 1024*1024*50,  # 50MB
                'backupCount': 10,
                'formatter': 'json' if is_production else 'verbose',
            },
        },
        'root': {
            'level': log_level,
            'handlers': ['console', 'file'],
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'file', 'error_file'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.security': {
                'handlers': ['security_file', 'console'],
                'level': 'INFO',
                'propagate': False,
            },
            'django.request': {
                'handlers': ['error_file', 'console'],
                'level': 'ERROR',
                'propagate': False,
            },
            'django.server': {
                'handlers': ['access_file'],
                'level': 'INFO',
                'propagate': False,
            },
            'freelance_platform': {
                'handlers': ['console', 'file', 'error_file'],
                'level': log_level,
                'propagate': False,
            },
            'ai_services': {
                'handlers': ['console', 'file', 'performance_file'],
                'level': log_level,
                'propagate': False,
            },
            'matching': {
                'handlers': ['console', 'file', 'performance_file'],
                'level': log_level,
                'propagate': False,
            },
            'payments': {
                'handlers': ['console', 'file', 'security_file'],
                'level': log_level,
                'propagate': False,
            },
            'projects': {
                'handlers': ['console', 'file'],
                'level': log_level,
                'propagate': False,
            },
            'users': {
                'handlers': ['console', 'file', 'security_file'],
                'level': log_level,
                'propagate': False,
            },
            'celery': {
                'handlers': ['console', 'celery_file'],
                'level': log_level,
                'propagate': False,
            },
            'celery.task': {
                'handlers': ['console', 'celery_file'],
                'level': log_level,
                'propagate': False,
            },
            'performance': {
                'handlers': ['performance_file', 'console'],
                'level': 'INFO',
                'propagate': False,
            },
            'gunicorn.error': {
                'handlers': ['error_file', 'console'],
                'level': 'INFO',
                'propagate': False,
            },
            'gunicorn.access': {
                'handlers': ['access_file'],
                'level': 'INFO',
                'propagate': False,
            },
        }
    }
    
    # Add Sentry handler if DSN is provided
    if sentry_dsn and is_production:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.logging import LoggingIntegration
            
            # Configure Sentry
            sentry_logging = LoggingIntegration(
                level=logging.INFO,        # Capture info and above as breadcrumbs
                event_level=logging.ERROR  # Send errors as events
            )
            
            sentry_sdk.init(
                dsn=sentry_dsn,
                integrations=[sentry_logging],
                traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
                send_default_pii=False,
                environment=os.environ.get('ENVIRONMENT', 'production'),
                release=os.environ.get('VERSION', '1.0.0'),
            )
            
        except ImportError:
            pass  # Sentry SDK not installed
    
    return config

# Legacy support - keep the old variable name for backward compatibility
LOGGING_CONFIG = get_logging_config()

# Middleware for request logging
class RequestLoggingMiddleware:
    """Middleware to log all requests"""
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger('django.server')
    
    def __call__(self, request):
        import time
        start_time = time.time()
        
        response = self.get_response(request)
        
        duration = time.time() - start_time
        
        # Log request details
        self.logger.info(
            f'{request.method} {request.get_full_path()} '
            f'{response.status_code} {duration:.3f}s '
            f'[{request.META.get("REMOTE_ADDR", "unknown")}] '
            f'"{request.META.get("HTTP_USER_AGENT", "unknown")}"'
        )
        
        return response

# Custom log formatter for structured logging
class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logging"""
    
    def format(self, record):
        # Add extra context to log records
        if hasattr(record, 'request'):
            record.user_id = getattr(record.request.user, 'id', None) if hasattr(record.request, 'user') else None
            record.ip_address = record.request.META.get('REMOTE_ADDR', 'unknown')
        
        return super().format(record)