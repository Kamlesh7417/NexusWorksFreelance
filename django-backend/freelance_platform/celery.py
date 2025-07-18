"""
Celery configuration for the freelance platform.
Handles background tasks for AI services, skill analysis, and periodic updates.
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'freelance_platform.settings')

app = Celery('freelance_platform')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule for periodic tasks
app.conf.beat_schedule = {
    # AI Services Tasks
    'update-developer-profiles': {
        'task': 'ai_services.tasks.update_all_developer_profiles',
        'schedule': 3600.0,  # Run every hour
    },
    'periodic-skill-profile-updates': {
        'task': 'ai_services.tasks.periodic_skill_profile_updates',
        'schedule': 1800.0,  # Run every 30 minutes
        'kwargs': {'batch_size': 5, 'max_updates_per_run': 25}
    },
    'validate-skill-confidence': {
        'task': 'ai_services.tasks.validate_and_update_skill_confidence',
        'schedule': 7200.0,  # Run every 2 hours
        'kwargs': {'batch_size': 20}
    },
    'refresh-skill-embeddings': {
        'task': 'ai_services.tasks.refresh_skill_embeddings',
        'schedule': 86400.0,  # Run daily
    },
    'cleanup-expired-cache': {
        'task': 'ai_services.tasks.cleanup_expired_cache',
        'schedule': 21600.0,  # Run every 6 hours
    },
    
    # Matching Service Tasks
    'precompute-matching-results': {
        'task': 'matching.tasks.precompute_matching_results',
        'schedule': 1800.0,  # Run every 30 minutes
        'kwargs': {'batch_size': 10}
    },
    'cleanup-expired-matching-cache': {
        'task': 'matching.tasks.cleanup_expired_matching_cache',
        'schedule': 21600.0,  # Run every 6 hours
    },
    'update-matching-analytics': {
        'task': 'matching.tasks.update_matching_analytics',
        'schedule': 3600.0,  # Run every hour
    },
    'optimize-matching-performance': {
        'task': 'matching.tasks.optimize_matching_performance',
        'schedule': 43200.0,  # Run every 12 hours
    },
    'monitor-matching-service-health': {
        'task': 'matching.tasks.monitor_matching_service_health',
        'schedule': 300.0,  # Run every 5 minutes
    },
    
    # Payment Service Tasks
    'check-overdue-payments': {
        'task': 'payments.tasks.check_overdue_payments_periodic',
        'schedule': 3600.0,  # Run every hour
    },
    'reconcile-gateway-payments': {
        'task': 'payments.tasks.reconcile_gateway_payments_periodic',
        'schedule': 21600.0,  # Run every 6 hours
    },
    'retry-failed-payments': {
        'task': 'payments.tasks.retry_failed_payments',
        'schedule': 7200.0,  # Run every 2 hours
    },
    'update-payment-gateway-metrics': {
        'task': 'payments.tasks.update_payment_gateway_metrics',
        'schedule': 3600.0,  # Run every hour
    },
    'generate-payment-analytics-report': {
        'task': 'payments.tasks.generate_payment_analytics_report',
        'schedule': 86400.0,  # Run daily
    },
    
    # System Monitoring Tasks
    'collect-system-health-metrics': {
        'task': 'monitoring.tasks.collect_system_health_metrics',
        'schedule': 300.0,  # Run every 5 minutes
    },
    'collect-ai-service-performance-metrics': {
        'task': 'monitoring.tasks.collect_ai_service_performance_metrics',
        'schedule': 600.0,  # Run every 10 minutes
    },
    'collect-task-queue-metrics': {
        'task': 'monitoring.tasks.collect_task_queue_metrics',
        'schedule': 300.0,  # Run every 5 minutes
    },
    'check-performance-thresholds': {
        'task': 'monitoring.tasks.check_performance_thresholds',
        'schedule': 600.0,  # Run every 10 minutes
    },
    'cleanup-old-metrics': {
        'task': 'monitoring.tasks.cleanup_old_metrics',
        'schedule': 86400.0,  # Run daily
    },
    'generate-performance-report': {
        'task': 'monitoring.tasks.generate_performance_report',
        'schedule': 3600.0,  # Run every hour
    },
    'monitor-and-recover-task-queues': {
        'task': 'monitoring.tasks.monitor_and_recover_task_queues',
        'schedule': 600.0,  # Run every 10 minutes
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration."""
    print(f'Request: {self.request!r}')