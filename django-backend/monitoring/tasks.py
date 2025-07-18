"""
Background tasks for system monitoring, performance metrics collection,
and alerting.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction, connection
from django.conf import settings
from django.db.models import Avg, Count, Sum

from .models import (
    ServiceHealthMetric, TaskQueueMetric, AIServiceMetric, 
    SystemAlert, PerformanceBenchmark
)
from users.models import User
from projects.models import Project
from matching.models import DeveloperMatch
from ai_services.models import DeveloperEmbedding

logger = logging.getLogger(__name__)


@shared_task
def collect_system_health_metrics():
    """
    Collect comprehensive system health metrics for all services.
    
    Returns:
        Dict with health metrics collection results
    """
    try:
        logger.info("Starting system health metrics collection")
        
        metrics_collected = []
        
        # Database health check
        db_metrics = _collect_database_metrics()
        ServiceHealthMetric.objects.create(**db_metrics)
        metrics_collected.append('database')
        
        # Cache health check
        cache_metrics = _collect_cache_metrics()
        ServiceHealthMetric.objects.create(**cache_metrics)
        metrics_collected.append('cache')
        
        # AI Services health check
        ai_metrics = _collect_ai_services_metrics()
        ServiceHealthMetric.objects.create(**ai_metrics)
        metrics_collected.append('ai_services')
        
        # Matching service health check
        matching_metrics = _collect_matching_service_metrics()
        ServiceHealthMetric.objects.create(**matching_metrics)
        metrics_collected.append('matching')
        
        # Payment service health check
        payment_metrics = _collect_payment_service_metrics()
        ServiceHealthMetric.objects.create(**payment_metrics)
        metrics_collected.append('payments')
        
        # GitHub integration health check
        github_metrics = _collect_github_integration_metrics()
        ServiceHealthMetric.objects.create(**github_metrics)
        metrics_collected.append('github_integration')
        
        # Celery task queue health check
        celery_metrics = _collect_celery_metrics()
        ServiceHealthMetric.objects.create(**celery_metrics)
        metrics_collected.append('celery')
        
        logger.info(f"Collected health metrics for {len(metrics_collected)} services")
        
        return {
            'success': True,
            'services_monitored': metrics_collected,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error collecting system health metrics: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def collect_ai_service_performance_metrics():
    """
    Collect detailed AI service performance and accuracy metrics.
    
    Returns:
        Dict with AI metrics collection results
    """
    try:
        logger.info("Starting AI service performance metrics collection")
        
        # Collect metrics for each AI service
        services = [
            'gemini_api',
            'embedding_service', 
            'github_analyzer',
            'skill_validator',
            'project_analyzer',
            'matching_engine'
        ]
        
        metrics_collected = []
        
        for service_type in services:
            try:
                metrics = _collect_ai_service_metrics(service_type)
                if metrics:
                    AIServiceMetric.objects.create(**metrics)
                    metrics_collected.append(service_type)
            except Exception as e:
                logger.error(f"Error collecting metrics for {service_type}: {str(e)}")
        
        # Check for performance degradation and create alerts
        _check_ai_service_alerts()
        
        logger.info(f"Collected AI metrics for {len(metrics_collected)} services")
        
        return {
            'success': True,
            'services_monitored': metrics_collected,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error collecting AI service metrics: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def collect_task_queue_metrics():
    """
    Collect Celery task queue performance metrics.
    
    Returns:
        Dict with task queue metrics collection results
    """
    try:
        logger.info("Starting task queue metrics collection")
        
        # Get Celery app instance
        from celery import current_app
        
        # Collect metrics for each queue
        queues = ['default', 'ai_services', 'matching', 'communications']
        metrics_collected = []
        
        for queue_name in queues:
            try:
                # Get queue statistics
                inspect = current_app.control.inspect()
                
                # Get active tasks
                active_tasks = inspect.active()
                queue_active = 0
                if active_tasks:
                    for worker, tasks in active_tasks.items():
                        queue_active += len([t for t in tasks if t.get('delivery_info', {}).get('routing_key') == queue_name])
                
                # Get reserved tasks (pending)
                reserved_tasks = inspect.reserved()
                queue_pending = 0
                if reserved_tasks:
                    for worker, tasks in reserved_tasks.items():
                        queue_pending += len([t for t in tasks if t.get('delivery_info', {}).get('routing_key') == queue_name])
                
                # Get worker count
                stats = inspect.stats()
                worker_count = len(stats) if stats else 0
                
                # Calculate completed/failed tasks from recent history
                # This would typically come from a task result backend
                completed_last_hour = _get_completed_tasks_count(queue_name, hours=1)
                failed_last_hour = _get_failed_tasks_count(queue_name, hours=1)
                
                # Calculate average task duration
                avg_duration = _get_average_task_duration(queue_name, hours=1)
                
                queue_metrics = TaskQueueMetric(
                    queue_name=queue_name,
                    pending_tasks=queue_pending,
                    active_tasks=queue_active,
                    completed_tasks_last_hour=completed_last_hour,
                    failed_tasks_last_hour=failed_last_hour,
                    average_task_duration=avg_duration,
                    worker_count=worker_count
                )
                queue_metrics.save()
                
                metrics_collected.append(queue_name)
                
            except Exception as e:
                logger.error(f"Error collecting metrics for queue {queue_name}: {str(e)}")
        
        # Check for task queue alerts
        _check_task_queue_alerts()
        
        logger.info(f"Collected task queue metrics for {len(metrics_collected)} queues")
        
        return {
            'success': True,
            'queues_monitored': metrics_collected,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error collecting task queue metrics: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def check_performance_thresholds():
    """
    Check performance metrics against defined thresholds and create alerts.
    
    Returns:
        Dict with threshold check results
    """
    try:
        logger.info("Starting performance threshold checks")
        
        # Get active benchmarks
        benchmarks = PerformanceBenchmark.objects.filter(is_active=True)
        
        alerts_created = 0
        checks_performed = 0
        
        for benchmark in benchmarks:
            try:
                # Get latest metric for this service
                latest_metric = ServiceHealthMetric.objects.filter(
                    service_name=benchmark.service_name
                ).order_by('-timestamp').first()
                
                if not latest_metric:
                    continue
                
                # Extract the relevant metric value
                metric_value = _extract_metric_value(latest_metric, benchmark.metric_name)
                
                if metric_value is None:
                    continue
                
                checks_performed += 1
                
                # Check thresholds
                alert_created = False
                
                if metric_value >= benchmark.critical_threshold:
                    alert_created = _create_alert(
                        service_name=benchmark.service_name,
                        alert_type=f"{benchmark.metric_name}_critical",
                        severity='critical',
                        title=f"Critical {benchmark.metric_name} threshold exceeded",
                        description=f"{benchmark.metric_name} is {metric_value} {benchmark.unit}, exceeding critical threshold of {benchmark.critical_threshold} {benchmark.unit}",
                        threshold_value=benchmark.critical_threshold,
                        actual_value=metric_value
                    )
                elif metric_value >= benchmark.warning_threshold:
                    alert_created = _create_alert(
                        service_name=benchmark.service_name,
                        alert_type=f"{benchmark.metric_name}_warning",
                        severity='high',
                        title=f"Warning {benchmark.metric_name} threshold exceeded",
                        description=f"{benchmark.metric_name} is {metric_value} {benchmark.unit}, exceeding warning threshold of {benchmark.warning_threshold} {benchmark.unit}",
                        threshold_value=benchmark.warning_threshold,
                        actual_value=metric_value
                    )
                
                if alert_created:
                    alerts_created += 1
                
            except Exception as e:
                logger.error(f"Error checking threshold for {benchmark}: {str(e)}")
        
        logger.info(f"Performed {checks_performed} threshold checks, created {alerts_created} alerts")
        
        return {
            'success': True,
            'checks_performed': checks_performed,
            'alerts_created': alerts_created,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error checking performance thresholds: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def cleanup_old_metrics():
    """
    Clean up old monitoring metrics to prevent database bloat.
    
    Returns:
        Dict with cleanup results
    """
    try:
        logger.info("Starting monitoring metrics cleanup")
        
        # Define retention periods
        retention_periods = {
            'ServiceHealthMetric': 7,  # days
            'TaskQueueMetric': 7,
            'AIServiceMetric': 14,
            'SystemAlert': 30,  # Keep alerts longer for analysis
        }
        
        cleanup_results = {}
        
        for model_name, days in retention_periods.items():
            try:
                cutoff_date = timezone.now() - timedelta(days=days)
                
                if model_name == 'ServiceHealthMetric':
                    deleted_count = ServiceHealthMetric.objects.filter(
                        timestamp__lt=cutoff_date
                    ).delete()[0]
                elif model_name == 'TaskQueueMetric':
                    deleted_count = TaskQueueMetric.objects.filter(
                        timestamp__lt=cutoff_date
                    ).delete()[0]
                elif model_name == 'AIServiceMetric':
                    deleted_count = AIServiceMetric.objects.filter(
                        timestamp__lt=cutoff_date
                    ).delete()[0]
                elif model_name == 'SystemAlert':
                    # Only delete resolved alerts
                    deleted_count = SystemAlert.objects.filter(
                        created_at__lt=cutoff_date,
                        status='resolved'
                    ).delete()[0]
                
                cleanup_results[model_name] = deleted_count
                logger.info(f"Cleaned up {deleted_count} {model_name} records")
                
            except Exception as e:
                logger.error(f"Error cleaning up {model_name}: {str(e)}")
                cleanup_results[model_name] = f"Error: {str(e)}"
        
        return {
            'success': True,
            'cleanup_results': cleanup_results,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in monitoring metrics cleanup: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def generate_performance_report():
    """
    Generate comprehensive performance report for the last 24 hours.
    
    Returns:
        Dict with performance report data
    """
    try:
        logger.info("Generating performance report")
        
        # Define report period
        end_time = timezone.now()
        start_time = end_time - timedelta(hours=24)
        
        report = {
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'system_health': {},
            'ai_services': {},
            'task_queues': {},
            'alerts': {},
            'recommendations': []
        }
        
        # System health summary
        health_metrics = ServiceHealthMetric.objects.filter(
            timestamp__gte=start_time
        )
        
        for service in ['database', 'cache', 'ai_services', 'matching', 'payments']:
            service_metrics = health_metrics.filter(service_name=service)
            if service_metrics.exists():
                latest = service_metrics.order_by('-timestamp').first()
                avg_response_time = service_metrics.aggregate(
                    avg=Avg('response_time_ms')
                )['avg'] or 0
                
                report['system_health'][service] = {
                    'current_status': latest.status,
                    'avg_response_time_ms': round(avg_response_time, 2),
                    'error_rate': latest.error_rate,
                    'uptime_percentage': _calculate_uptime_percentage(service_metrics)
                }
        
        # AI services summary
        ai_metrics = AIServiceMetric.objects.filter(
            timestamp__gte=start_time
        )
        
        for service_type in ['gemini_api', 'embedding_service', 'matching_engine']:
            service_ai_metrics = ai_metrics.filter(service_type=service_type)
            if service_ai_metrics.exists():
                latest = service_ai_metrics.order_by('-timestamp').first()
                total_requests = service_ai_metrics.aggregate(
                    sum=Sum('requests_count')
                )['sum'] or 0
                
                report['ai_services'][service_type] = {
                    'total_requests': total_requests,
                    'success_rate': latest.success_rate,
                    'avg_response_time': latest.average_response_time,
                    'accuracy_score': latest.accuracy_score
                }
        
        # Task queue summary
        queue_metrics = TaskQueueMetric.objects.filter(
            timestamp__gte=start_time
        )
        
        for queue in ['default', 'ai_services', 'matching']:
            queue_data = queue_metrics.filter(queue_name=queue)
            if queue_data.exists():
                latest = queue_data.order_by('-timestamp').first()
                total_completed = queue_data.aggregate(
                    sum=Sum('completed_tasks_last_hour')
                )['sum'] or 0
                total_failed = queue_data.aggregate(
                    sum=Sum('failed_tasks_last_hour')
                )['sum'] or 0
                
                report['task_queues'][queue] = {
                    'current_pending': latest.pending_tasks,
                    'current_active': latest.active_tasks,
                    'total_completed': total_completed,
                    'total_failed': total_failed,
                    'success_rate': (total_completed / (total_completed + total_failed) * 100) if (total_completed + total_failed) > 0 else 100,
                    'avg_duration': latest.average_task_duration
                }
        
        # Alerts summary
        alerts = SystemAlert.objects.filter(
            created_at__gte=start_time
        )
        
        report['alerts'] = {
            'total': alerts.count(),
            'by_severity': {
                'critical': alerts.filter(severity='critical').count(),
                'high': alerts.filter(severity='high').count(),
                'medium': alerts.filter(severity='medium').count(),
                'low': alerts.filter(severity='low').count()
            },
            'active': alerts.filter(status='active').count(),
            'resolved': alerts.filter(status='resolved').count()
        }
        
        # Generate recommendations
        report['recommendations'] = _generate_performance_recommendations(report)
        
        # Store report in cache for dashboard access
        cache.set('performance_report_24h', report, timeout=3600)  # 1 hour
        
        logger.info("Performance report generated successfully")
        
        return {
            'success': True,
            'report': report,
            'generated_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating performance report: {str(e)}")
        return {'success': False, 'error': str(e)}


@shared_task
def monitor_and_recover_task_queues():
    """
    Monitor task queues and execute recovery procedures if needed.
    
    Returns:
        Dict with monitoring and recovery results
    """
    try:
        logger.info("Starting task queue monitoring and recovery")
        
        from .queue_monitor import TaskRecoveryManager
        
        # Execute comprehensive recovery plan
        recovery_manager = TaskRecoveryManager()
        recovery_results = recovery_manager.execute_recovery_plan()
        
        # Log results
        if recovery_results.get('issues_found'):
            logger.warning(f"Found {len(recovery_results['issues_found'])} queue issues")
            for issue in recovery_results['issues_found']:
                logger.warning(f"Queue issue: {issue['message']}")
        
        if recovery_results.get('alerts_created', 0) > 0:
            logger.info(f"Created {recovery_results['alerts_created']} alerts")
        
        if recovery_results.get('recovery_actions'):
            logger.info(f"Executed {len(recovery_results['recovery_actions'])} recovery actions")
        
        return {
            'success': True,
            'monitoring_results': recovery_results,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in task queue monitoring and recovery: {str(e)}")
        return {'success': False, 'error': str(e)}


# Helper functions

def _collect_database_metrics():
    """Collect database health metrics."""
    start_time = time.time()
    
    try:
        # Test database connectivity and performance
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Get database statistics
        user_count = User.objects.count()
        project_count = Project.objects.count()
        
        return {
            'service_name': 'database',
            'status': 'healthy' if response_time < 100 else 'degraded',
            'response_time_ms': int(response_time),
            'error_rate': 0.0,
            'custom_metrics': {
                'user_count': user_count,
                'project_count': project_count,
                'connection_pool_size': getattr(connection, 'pool_size', 'unknown')
            }
        }
    except Exception as e:
        return {
            'service_name': 'database',
            'status': 'unhealthy',
            'response_time_ms': int((time.time() - start_time) * 1000),
            'error_rate': 100.0,
            'alerts': [f"Database error: {str(e)}"]
        }


def _collect_cache_metrics():
    """Collect cache service health metrics."""
    start_time = time.time()
    
    try:
        # Test cache connectivity
        test_key = f"health_check_{int(time.time())}"
        cache.set(test_key, 'ok', timeout=60)
        result = cache.get(test_key)
        cache.delete(test_key)
        
        response_time = (time.time() - start_time) * 1000
        
        if result == 'ok':
            return {
                'service_name': 'cache',
                'status': 'healthy',
                'response_time_ms': int(response_time),
                'error_rate': 0.0,
                'custom_metrics': {
                    'redis_connection': 'active'
                }
            }
        else:
            return {
                'service_name': 'cache',
                'status': 'degraded',
                'response_time_ms': int(response_time),
                'error_rate': 50.0,
                'alerts': ['Cache read/write test failed']
            }
    except Exception as e:
        return {
            'service_name': 'cache',
            'status': 'unhealthy',
            'response_time_ms': int((time.time() - start_time) * 1000),
            'error_rate': 100.0,
            'alerts': [f"Cache error: {str(e)}"]
        }


def _collect_ai_services_metrics():
    """Collect AI services health metrics."""
    try:
        # Check recent AI service activity
        recent_embeddings = DeveloperEmbedding.objects.filter(
            last_github_update__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        recent_matches = DeveloperMatch.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        # Simple health check - if we have recent activity, services are likely healthy
        if recent_embeddings > 0 or recent_matches > 0:
            status = 'healthy'
            error_rate = 0.0
        else:
            status = 'degraded'
            error_rate = 10.0  # Low activity might indicate issues
        
        return {
            'service_name': 'ai_services',
            'status': status,
            'response_time_ms': 500,  # Estimated
            'error_rate': error_rate,
            'custom_metrics': {
                'recent_embeddings': recent_embeddings,
                'recent_matches': recent_matches
            }
        }
    except Exception as e:
        return {
            'service_name': 'ai_services',
            'status': 'unhealthy',
            'response_time_ms': 5000,
            'error_rate': 100.0,
            'alerts': [f"AI services error: {str(e)}"]
        }


def _collect_matching_service_metrics():
    """Collect matching service health metrics."""
    try:
        # Check recent matching activity
        recent_matches = DeveloperMatch.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        )
        
        if recent_matches.exists():
            avg_score = recent_matches.aggregate(avg=Avg('match_score'))['avg']
            status = 'healthy' if avg_score > 0.6 else 'degraded'
            error_rate = 0.0 if avg_score > 0.6 else 20.0
        else:
            status = 'degraded'
            error_rate = 10.0
            avg_score = 0.0
        
        return {
            'service_name': 'matching',
            'status': status,
            'response_time_ms': 1000,  # Estimated
            'error_rate': error_rate,
            'custom_metrics': {
                'recent_matches_count': recent_matches.count(),
                'avg_match_score': float(avg_score) if avg_score else 0.0
            }
        }
    except Exception as e:
        return {
            'service_name': 'matching',
            'status': 'unhealthy',
            'response_time_ms': 5000,
            'error_rate': 100.0,
            'alerts': [f"Matching service error: {str(e)}"]
        }


def _collect_payment_service_metrics():
    """Collect payment service health metrics."""
    try:
        from payments.models import Payment
        
        # Check recent payment activity
        recent_payments = Payment.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        )
        
        if recent_payments.exists():
            success_count = recent_payments.filter(status='completed').count()
            total_count = recent_payments.count()
            success_rate = (success_count / total_count) * 100
            
            status = 'healthy' if success_rate > 90 else 'degraded'
            error_rate = 100 - success_rate
        else:
            status = 'healthy'  # No recent activity is normal
            error_rate = 0.0
            success_rate = 100.0
        
        return {
            'service_name': 'payments',
            'status': status,
            'response_time_ms': 2000,  # Estimated
            'error_rate': error_rate,
            'custom_metrics': {
                'recent_payments_count': recent_payments.count() if 'recent_payments' in locals() else 0,
                'payment_success_rate': success_rate if 'success_rate' in locals() else 100.0
            }
        }
    except Exception as e:
        return {
            'service_name': 'payments',
            'status': 'unhealthy',
            'response_time_ms': 5000,
            'error_rate': 100.0,
            'alerts': [f"Payment service error: {str(e)}"]
        }


def _collect_github_integration_metrics():
    """Collect GitHub integration health metrics."""
    try:
        # Check recent GitHub analysis activity
        recent_updates = User.objects.filter(
            role='developer',
            developer_profile__github_analysis__analyzed_at__gte=(timezone.now() - timedelta(hours=1)).isoformat()
        ).count()
        
        status = 'healthy' if recent_updates > 0 else 'degraded'
        error_rate = 0.0 if recent_updates > 0 else 10.0
        
        return {
            'service_name': 'github_integration',
            'status': status,
            'response_time_ms': 1500,  # Estimated
            'error_rate': error_rate,
            'custom_metrics': {
                'recent_github_updates': recent_updates
            }
        }
    except Exception as e:
        return {
            'service_name': 'github_integration',
            'status': 'unhealthy',
            'response_time_ms': 5000,
            'error_rate': 100.0,
            'alerts': [f"GitHub integration error: {str(e)}"]
        }


def _collect_celery_metrics():
    """Collect Celery task queue health metrics."""
    try:
        from celery import current_app
        
        # Get Celery statistics
        inspect = current_app.control.inspect()
        stats = inspect.stats()
        
        if stats:
            worker_count = len(stats)
            status = 'healthy' if worker_count > 0 else 'degraded'
            error_rate = 0.0 if worker_count > 0 else 50.0
        else:
            worker_count = 0
            status = 'unhealthy'
            error_rate = 100.0
        
        return {
            'service_name': 'celery',
            'status': status,
            'response_time_ms': 100,  # Task queue is typically fast
            'error_rate': error_rate,
            'custom_metrics': {
                'active_workers': worker_count
            }
        }
    except Exception as e:
        return {
            'service_name': 'celery',
            'status': 'unhealthy',
            'response_time_ms': 1000,
            'error_rate': 100.0,
            'alerts': [f"Celery error: {str(e)}"]
        }


def _collect_ai_service_metrics(service_type):
    """Collect metrics for a specific AI service."""
    # This would be implemented based on actual service usage
    # For now, return basic metrics structure
    return {
        'service_type': service_type,
        'requests_count': 0,
        'successful_requests': 0,
        'failed_requests': 0,
        'average_response_time': 0.0,
        'accuracy_score': None,
        'confidence_score': None,
        'api_quota_used': 0,
        'performance_metrics': {}
    }


def _check_ai_service_alerts():
    """Check AI service metrics and create alerts if needed."""
    # Implementation for AI service alerting
    pass


def _check_task_queue_alerts():
    """Check task queue metrics and create alerts if needed."""
    # Implementation for task queue alerting
    pass


def _get_completed_tasks_count(queue_name, hours=1):
    """Get completed tasks count for a queue in the last N hours."""
    # This would typically query the Celery result backend
    return 0


def _get_failed_tasks_count(queue_name, hours=1):
    """Get failed tasks count for a queue in the last N hours."""
    # This would typically query the Celery result backend
    return 0


def _get_average_task_duration(queue_name, hours=1):
    """Get average task duration for a queue in the last N hours."""
    # This would typically query the Celery result backend
    return 0.0


def _extract_metric_value(metric, metric_name):
    """Extract specific metric value from ServiceHealthMetric."""
    if metric_name == 'response_time_ms':
        return metric.response_time_ms
    elif metric_name == 'error_rate':
        return metric.error_rate
    elif metric_name == 'cpu_usage':
        return metric.cpu_usage
    elif metric_name == 'memory_usage':
        return metric.memory_usage
    else:
        return metric.custom_metrics.get(metric_name)


def _create_alert(service_name, alert_type, severity, title, description, threshold_value=None, actual_value=None):
    """Create a system alert if it doesn't already exist."""
    existing_alert = SystemAlert.objects.filter(
        service_name=service_name,
        alert_type=alert_type,
        status='active'
    ).first()
    
    if not existing_alert:
        SystemAlert.objects.create(
            service_name=service_name,
            alert_type=alert_type,
            severity=severity,
            title=title,
            description=description,
            threshold_value=threshold_value,
            actual_value=actual_value
        )
        return True
    
    return False


def _calculate_uptime_percentage(metrics_queryset):
    """Calculate uptime percentage from health metrics."""
    total_metrics = metrics_queryset.count()
    if total_metrics == 0:
        return 100.0
    
    healthy_metrics = metrics_queryset.filter(status='healthy').count()
    return (healthy_metrics / total_metrics) * 100


def _generate_performance_recommendations(report):
    """Generate performance recommendations based on report data."""
    recommendations = []
    
    # Check system health
    for service, metrics in report['system_health'].items():
        if metrics['uptime_percentage'] < 95:
            recommendations.append(f"Investigate {service} reliability issues - uptime is {metrics['uptime_percentage']:.1f}%")
        
        if metrics['avg_response_time_ms'] > 1000:
            recommendations.append(f"Optimize {service} performance - average response time is {metrics['avg_response_time_ms']:.0f}ms")
    
    # Check AI services
    for service, metrics in report['ai_services'].items():
        if metrics['success_rate'] < 95:
            recommendations.append(f"Investigate {service} failures - success rate is {metrics['success_rate']:.1f}%")
    
    # Check task queues
    for queue, metrics in report['task_queues'].items():
        if metrics['success_rate'] < 95:
            recommendations.append(f"Investigate {queue} queue failures - success rate is {metrics['success_rate']:.1f}%")
        
        if metrics['current_pending'] > 100:
            recommendations.append(f"Consider scaling {queue} queue workers - {metrics['current_pending']} tasks pending")
    
    return recommendations